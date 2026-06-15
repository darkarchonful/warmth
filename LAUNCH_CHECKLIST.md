# Warmth — App Store Launch Checklist

Public iOS launch readiness. Status legend: ✅ done · ⏳ in progress · ⬜ not started.

> **Hard constraint:** the real launch runs on the **Armenia IE** Apple Developer
> account. The rented **All Your Legals Limited** account is a nominee test rig —
> never put real users, banking, IAP, or revenue on it. TestFlight builds 17/18
> live there for testing only; the public release is a migration to Armenia.

---

## 1. Apple account & legal  (critical path)
- ⬜ Enroll / activate the **Armenia IE** Apple Developer account (prepay was planned ~2026-05-31)
- ⬜ Create the App Store Connect **app record** under the Armenia team (new bundle id or app transfer)
- ⬜ Generate fresh **signing credentials** (distribution cert + provisioning profile) on the Armenia team
- ⬜ Sign the **Paid Applications Agreement** (required before any IAP works)
- ⬜ Complete **banking + tax** info on the Armenia entity (W-8/tax forms)

## 2. App Store Connect listing
- ✅ **Listing copy drafted** — name, subtitle, description, keywords, categories in `docs/APP_STORE_LISTING.md` (still needs entering into ASC)
- ✅ **Screenshots captured** — 5-shot set (swipe / match / plans / plan+comment / memory) via demo account, apostrophes fixed in seed. Plan in `docs/APP_STORE_SCREENSHOTS.md`. ⬜ still needs uploading to ASC (6.7" slot, order 1→5) once the Armenia app record exists
- ✅ **App icon 1024×1024** — variant A (interlocking swirl), `app/assets/icon.png`, shipped in build 20
- ✅ **Privacy Policy URL** — https://warmth-api.dbtvault-solutions.tech/privacy (live)
- ✅ **Support URL** — https://warmth-api.dbtvault-solutions.tech/support (live, v32) · ⬜ optional marketing URL
- ✅ **App Privacy "nutrition label"** — paste-ready ASC answers in `docs/APP_PRIVACY_NUTRITION_LABEL.md` (all data Linked / App Functionality / **not** tracking; no location, no ad SDKs). ⬜ still needs entering into ASC
- ✅ **Age rating questionnaire** — answers in `docs/APP_AGE_RATING.md`, lands at **12+**. ⬜ still needs entering into ASC

## 3. Guideline compliance
- ✅ **Sign in with Apple** (required alongside Google sign-in) — built
- ✅ **In-app account deletion** (guideline 5.1.1(v)) — shipped (settings → delete)
- ⬜ **Real IAP via StoreKit** (see §4) — digital premium must use Apple IAP
- ⬜ Remove `DISABLE_SWIPE_LIMIT` env flag before public release
- ⬜ Export compliance / encryption declaration (HTTPS-only → standard exemption)

## 4. In-App Purchase / monetization
- ⬜ Configure IAP products in ASC: subscription group + monthly/yearly, prices, localizations
- ⬜ IAP review screenshot + metadata per product
- ⬜ Server-side **StoreKit receipt validation** to replace `mock-subscribe` (branch `premium-monetization`)
- ⬜ Wire the app paywall to real purchase flow + restore purchases
- (depends on §1 Paid Apps Agreement + banking)

## 5. App Review prep  (common rejection points)
- ✅ **Demo account + pre-paired partner** — `appreview@warmth.dbtvault-solutions.tech` / code `473829`, pre-paired with "Sam", seeded with 2 plans + 1 memory + a comment. Login bypass env-gated (API v30). Verified end-to-end.
- ⬜ No placeholder content at review time (ties to §6 card images)
- ✅ **Review notes** — `docs/APP_REVIEW_NOTES.md` (paste into ASC App Review Information)
- ✅ **Re-pair cooldown disabled for review** — 48h same-couple cooldown gated behind `REPAIR_COOLDOWN_HOURS` (default 0); reviewer can pair→unpair→re-pair freely. Restore to `48` post-launch (see §7).

## 6. App polish / content
- ⬜ **Real card images** to replace emoji placeholders (flagged as pre-launch must)
- ⬜ Final copy pass on cards / onboarding

## 7. Backend / infra hardening (from prod-gaps)
- ⬜ **Restore re-pair cooldown post-launch** — set `REPAIR_COOLDOWN_HOURS: "48"` in `k3s/30-api.yaml` + re-apply (disabled at 0 for testing/review, code intact)
- ⬜ TLS cert auto-renewal check (warmth-api + edge)
- ⬜ CI/CD for API image build + deploy (currently manual docker build → kubectl)
- ⬜ Basic observability (error logging/alerting on the API + scheduler)
- ⬜ DB indexes / partitioning review for scale

## 8. Pre-submit final checks
- ⬜ Fresh production build on the Armenia team, channel `production`, runtime matches OTA
- ⬜ Smoke test the full flow on a clean device: register → pair → swipe → plan → nudge → premium
- ⬜ Confirm push notifications deliver on a release build
- ⬜ Submit for review with demo account + notes

---

### Already shipped (foundation)
- Email login (Resend HTTPS), Google + Apple sign-in, account linking by verified email
- Couple invite/pairing, swipe deck, plans/checklist, memories, comments
- Push notifications (user-event + scheduler rules incl. stale-plan nudge)
- Account deletion + settings (unpair/delete)
- Graceful not-found on detail screens
