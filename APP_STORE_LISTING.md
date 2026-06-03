# Warmth — App Store Connect listing (draft)

Living draft of the App Store listing. The actual ASC entry is created on the
**Armenia IE launch account** (NOT the rented UK Ltd test account). This file is
account-independent prep — copy/paste when the account is ready.

Assumption: **v1 launches FREE** (no premium / no IAP). Shipping premium later
adds StoreKit + a signed Paid Applications Agreement (Armenia account only).

---

## App name (≤30 chars) — PICK ONE
- `Warmth: Closer Together` (23) ← recommended
- `Warmth — Date Ideas for Two` (27)
- `Warmth` (6) — cleanest, but check Store uniqueness

## Subtitle (≤30 chars)
`Date ideas & shared memories` (28)

## Promotional text (≤170 chars)
Discover things to do together, agree on what you both love, and turn them into
memories you keep. A private space for two — no feeds, no followers, no noise.

## Description (≤4000 chars)
**Warmth is a private space for two.** Discover things to do together, agree on
what excites you both, and turn good intentions into real moments.

Swipe through thoughtfully chosen activities — from tiny everyday gestures to
bigger adventures. When you both like the same idea, it lands in your shared
plan. Do it together, then keep it forever as a memory with a photo and a note.

No feeds. No followers. No noise. Just you and your partner.

**WHAT YOU CAN DO**
- Swipe to discover date ideas and small gestures, matched to the season
- Build a shared plan from the things you *both* want to do
- Capture completed activities as memories, with photos and notes
- Add your own custom activities, personal to your relationship
- Gentle nudges to revisit favorites and keep the spark alive
- Pair privately with a single invite code

**WHY WARMTH**
Closeness isn't built on grand gestures — it's the small, consistent ones.
Warmth makes them easy to find, easy to agree on, and easy to remember.

Pair with your partner and start today.

## Keywords (≤100 chars, comma-separated)
`couple,relationship,date ideas,date night,partner,love,marriage,together,bonding,memories,activities`

## Category & rating
- Primary: **Lifestyle** · Secondary: **Health & Fitness**
- Age rating: **4+** (no mature/objectionable content — confirm questionnaire)

---

## App Privacy "nutrition label" (declare honestly)
- **Contact Info → Email, Name** — linked to identity, used for *App Functionality*
  (account + pairing). Not for tracking.
- **User Content → Photos, Other (notes/comments)** — linked, App Functionality.
- **Identifiers → User ID** (+ push token) — linked, App Functionality.
- **No data used for tracking. No third-party ads/analytics SDKs.** (True for v1 —
  keep it that way.)
- Data deletion: **Yes**, in-app (Settings → Delete account; Guideline 5.1.1(v)).

## Guideline compliance already satisfied
- ✅ Account deletion in-app (5.1.1(v)).
- ✅ Sign in with Apple offered alongside Google (4.8) — redo capability on launch account.
- ✅ `ITSAppUsesNonExemptEncryption: false` set.

---

## ⚠️ Assets to produce
- **App icon 1024×1024** (export from `assets/icon.png`).
- **Screenshots**: 6.7" iPhone required; 6.5"/5.5" optional. iPad NOT required
  (`supportsTablet: false` as of this prep).
- **Privacy Policy URL** + **Support URL** (host on a dbtvault-solutions.tech / Warmth subdomain).

## ⚠️ App Review demo path (pairing trap)
Reviewers must use the app, but it needs login AND a paired partner, and the app
only supports Google/Apple sign-in (no password to hand over). Solution ties to
backend hardening: when the open `/auth/dev` endpoint is locked down, replace it
with a **review-gated login** (requires a secret token). Then in App Review notes:
> Two demo accounts are pre-paired. Use review code `XXXX` on the login screen to
> sign in as the demo couple and see the full swipe → plan → memory flow.

---

## Pre-submit checklist (cross-ref full launch plan)
- [ ] Armenia account: App ID, signing, Sign in with Apple capability (TTY build),
      APNs key, new Google OAuth clients, re-create EAS Update.
- [ ] Backend hardening: disable open `/auth/dev`, remove `DISABLE_SWIPE_LIMIT=1`,
      DB backups + monitoring.
- [ ] Privacy Policy + Terms hosted and linked.
- [ ] Reviewer demo accounts + review-gated login.
- [ ] Icon + screenshots uploaded.
