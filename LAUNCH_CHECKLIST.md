# Warmth — App Store Launch Checklist

Public iOS launch readiness. Status legend: ✅ done · ⏳ in progress · ⬜ not started.

> **Hard constraint:** the real launch runs on the **Armenia IE** Apple Developer
> account. The rented **All Your Legals Limited** account is a nominee test rig —
> never put real users, banking, IAP, or revenue on it. TestFlight builds 17/18
> live there for testing only; the public release is a migration to Armenia.

---

## 1. Apple account & legal  (critical path)
- ✅ Enroll / activate the Apple Developer account — **Armenia Individual** (not IE), Team `6P6BXDX8K8`, active 2026-08-25
- ✅ Create the App Store Connect **app record** — "Warmth: Ideas for Two", ascAppId `6808587453`, bundle `tech.dbtvault-solutions.warmth`
- ✅ Generate fresh **signing credentials** on the Armenia team (dist cert + profile + APNs, stored on EAS) — TestFlight build **5** live + smoke-tested (launch, Apple/Google/email sign-in, data load all pass) 2026-09-07
- ✅ **Paid Applications Agreement signed** (2026-09-09) — active.
- ✅ **Banking + tax DONE** (2026-09-09): bank = **Ardshinbank USD** (individual account, name Aleksei Nesterov), payout currency USD, status **Active**. Tax forms **W-8BEN + U.S. Certificate of Foreign Status both Active** (Part II treaty claim left blank — no US withholding on non-US app sales anyway; citizenship line was locked to Armenia by Apple = account country, non-editable, negligible effect). DSA = **non-trader (no EU distribution)** to keep personal address/phone private — revisit when monetizing.
- ✅ **Apple Small Business Program — enrollment SUBMITTED** (2026-09-09; approval email pending, 15% rate effective 1st of next month). Answered No to all four association questions (standalone individual account; UK rig doesn't count — Admin-only, not owned/controlled). **Apple monetization setup now fully complete** — premium waits only on app-side StoreKit code (RevenueCat) later.

## 2. App Store Connect listing  — ALL ENTERED INTO ASC 2026-09-07
- ✅ **Listing copy** — name "Warmth: Ideas for Two", subtitle, description, keywords, categories (Lifestyle / Social Networking) entered in ASC. Source `docs/APP_STORE_LISTING.md`
- ✅ **Screenshots uploaded** — 5-shot set entered in ASC. NOTE: the slot required **1284×2778** (not 1290×2796); upload-ready set generated at `docs/screens/upload6528/` from fresh iPhone 15 Pro Max captures (`docs/screens/IMG_*.jpeg`). Old 1290×2796 set (`docs/screens/upload/`) was rejected by that slot.
- ✅ **App icon 1024×1024** — variant A (interlocking swirl), `app/assets/icon.png`
- ✅ **Privacy Policy URL** entered — https://dbtvault-solutions.tech/warmth/privacy/ (found under **App Privacy** page in current ASC, not App Information)
- ✅ **Support URL** entered — https://dbtvault-solutions.tech/warmth/support/ · ⬜ optional marketing URL
- ✅ **App Privacy "nutrition label"** entered in ASC (all data Linked / App Functionality / **not** tracking; no location, no ad SDKs). Source `docs/APP_PRIVACY_NUTRITION_LABEL.md`
- ✅ **Age rating** entered — new 2025 questionnaire computed 9+, **manually raised to 13+** (the new system's equivalent of the old 12+; bands are now 4+/9+/13+/16+/18+). Source `docs/APP_AGE_RATING.md`
- ✅ **Pricing** — set to **Free** in Pricing and Availability (required field; no Paid Apps agreement needed for a free app)

## 3. Guideline compliance
- ✅ **Sign in with Apple** (required alongside Google sign-in) — built
- ✅ **In-app account deletion** (guideline 5.1.1(v)) — shipped (settings → delete)
- ⬜ **Real IAP via StoreKit** (see §4) — digital premium must use Apple IAP
- ✅ **Daily swipe cap ENABLED** for launch — `DISABLE_SWIPE_LIMIT=0`, `DAILY_SWIPE_LIMIT=8` (API v48). Gentle "come back tomorrow" cap, no paywall (master has no premium UI). Demo/review accounts exempt in code so a reviewer is never blocked.
- ⬜ Export compliance / encryption declaration (HTTPS-only → standard exemption)

## 4. In-App Purchase / monetization
- ⬜ Configure IAP products in ASC: subscription group + monthly/yearly, prices, localizations
- ⬜ IAP review screenshot + metadata per product
- ⬜ Server-side **StoreKit receipt validation** to replace `mock-subscribe` (branch `premium-monetization`)
- ⬜ Wire the app paywall to real purchase flow + restore purchases
- (depends on §1 Paid Apps Agreement + banking)

## 5. App Review prep  (common rejection points)
- ✅ **Demo account + pre-paired partner** — `appreview@warmth.dbtvault-solutions.tech` / code `473829`, pre-paired with "Sam", seeded with 2 plans + 1 memory + a comment. Login bypass env-gated (API v30). Verified end-to-end.
- ✅ No placeholder content at review time — all deck cards have art (2026-09-17)
- ✅ **Review notes** — `docs/APP_REVIEW_NOTES.md` (paste into ASC App Review Information)
- ✅ **Re-pair cooldown disabled for review** — 48h same-couple cooldown gated behind `REPAIR_COOLDOWN_HOURS` (default 0); reviewer can pair→unpair→re-pair freely. Restore to `48` post-launch (see §7).

## 6. App polish / content
- ✅ **Real card images** — DONE 2026-09-17: all 222 deck cards have art (media image v7); 5 cards that never got good art were removed from the deck
- ⬜ Final copy pass on cards / onboarding

## 7. Backend / infra hardening (from prod-gaps)
- ⬜ **Restore re-pair cooldown post-launch** — set `REPAIR_COOLDOWN_HOURS: "48"` in `k3s/30-api.yaml` + re-apply (disabled at 0 for testing/review, code intact)
- ⬜ **Set invite install link at launch** — set `EXPO_PUBLIC_INVITE_URL` to the App Store URL (+ Play later) and OTA; the invite share then appends "Get it here: <url>" so an unpartnered person can install. Plumbing built in `app/app/index.js` (invite share), no-op until the env is set. No native build needed.
- ⬜ TLS cert auto-renewal check (warmth-api + edge)
- ⬜ CI/CD for API image build + deploy (currently manual docker build → kubectl)
- ⬜ Basic observability (error logging/alerting on the API + scheduler)
- ⬜ DB indexes / partitioning review for scale

## 8. Pre-submit final checks
- ✅ Production build on the Armenia team — **build 6** (1.0.0, runtime `eca14527`, includes expo-video), channel `production`, on TestFlight since 2026-09-14. **Submit build 6, not build 5.** All later JS changes ship over the air on the same runtime (latest OTA 2026-09-17); verified 2026-09-17 that build runtime == OTA runtime, so no new build is needed.
- ✅ **Smoke test 2026-09-17** — email login → pair by invite → 2 matches → comments both ways → approve → complete → memory → photo → unpair (shared data wiped). All passed. Findings: login email landed in Gmail Spam on first contact (SPF/DKIM OK, DMARC p=none inherited); plan comments are left orphaned in `comments` after unpair.
- ✅ **Push notifications verified 2026-09-17** on the owner's phone with the app closed: "Paired!", "You matched!" (tap opens Plans), comment push (tap opens the plan), approval + completion pushes. Partner side driven through the API.
- ✅ **SUBMITTED FOR REVIEW 2026-09-17** — version 1.0.0, build 6, demo account + review notes attached. While "Waiting for Review / In Review": do not touch the demo accounts (`appreview@…`, `appreview.partner@…`) or their data, keep `DEMO_EMAIL`/`DEMO_CODE` and `REPAIR_COOLDOWN_HOURS=0` in place, avoid risky API deploys and native changes, keep OTAs to fixes only.
- ⏳ **2026-09-18 Apple: Guideline 2.1 "Information Needed – New App Submission"** (standard request for accounts with limited review history, not an app defect). **Replied 2026-09-21** with the screen recording (demo walkthrough + register/delete a throwaway account) and the written answers (`docs/APP_REVIEW_REPLY_PASTE.txt`, under the 4000-char field limit). Fixed on the way, all via OTA: Settings → Help (support / report / privacy), branded support address `warmth@dbtvault-solutions.tech`, contact dialog instead of bare mailto, and a **Settings link on the pairing screen** so unpaired accounts can delete themselves (5.1.1(v)). Demo couple re-seeded after recording. Same text + the recording also saved in App Review Information (Notes + attachment). Because editing the review information left **Resubmit to App Review** as the only action (Apple's help page: an edited rejected submission moves forward via Resubmit; forum reports are split on whether a reply alone is read), the submission was **RESUBMITTED 2026-09-21** with build 6 unchanged. Waiting for Apple (typically 24–48 h).

---

## LAUNCH PATH DECISION (2026-09-07): FREE-FIRST
Build 5 = master (no paywall; `premium-monetization` unmerged), so the first release is a **FREE app, no IAP**. That means §1 Paid Apps/banking, §3 IAP, and all of §4 are **NOT blockers** — deferred until premium ships as a later build. Only hard blocker remaining = **§6 real card images** (emoji placeholders → placeholder-content rejection risk). Also verify before submit: push on build 5, TLS cert health (§7). DECISION 2026-09-07: **enabled the daily swipe cap** (`DISABLE_SWIPE_LIMIT=0`, limit 8, demo-exempt) as a habit mechanic even without premium — the blocked state is a "come back tomorrow" screen with no paywall, so it's review-safe; sets up the premium "unlimited" upsell later.

---

### Already shipped (foundation)
- Email login (Resend HTTPS), Google + Apple sign-in, account linking by verified email
- Couple invite/pairing, swipe deck, plans/checklist, memories, comments
- Push notifications (user-event + scheduler rules incl. stale-plan nudge)
- Account deletion + settings (unpair/delete)
- Graceful not-found on detail screens
