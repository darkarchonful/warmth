# App Review Information (for App Store Connect)

Paste these into the **App Review Information** section of the submission.

## Demo account (Sign-in)
- **Sign-in method:** choose **"Email"** on the welcome screen.
- **Email:** `appreview@warmth.dbtvault-solutions.tech`
- **Login code:** `473829`

> This account uses passwordless email sign-in. Enter the email, tap to request
> a code, then enter the fixed code **473829** above. No email is actually
> delivered for this account — the code is pre-set for review. (You do **not**
> need Google or Apple sign-in to review the app.)

## Notes for the Reviewer

Warmth is a private app for **two paired partners** to discover and plan things
to do together. It is not a social network and does not connect strangers.

The demo account is **already paired** with a partner ("Sam") and pre-loaded with
sample content, so you can review the full experience from one device without
needing a second person:

- **Swipe deck** (home): swipe right to like an idea, left to pass. When both
  partners like the same idea it becomes a shared Plan.
- **Plans:** one agreed plan ("Cook dinner together") and one awaiting
  confirmation ("Movie night at home"). Open the "Cook dinner together" plan to
  see the in-plan comment thread with the partner.
- **Memories:** one completed activity ("Morning coffee together") with both
  partners' ratings and notes.
- **Account controls:** Settings (top of the deck) includes **unpair** and
  **delete account**.

Pairing in normal use is done by one partner sharing an invite code and the
other entering it; since review is single-device, we have pre-paired the demo
account so this step is not required.

**Optional — testing the live match across two devices:** if you'd like to see
two partners match in real time, you can sign in as the partner on a second
device or simulator using the same Email method:
- **Partner email:** `appreview.partner@warmth.dbtvault-solutions.tech`
- **Login code:** `473829` (same fixed code)
Like the same idea on both accounts and it appears as a shared Plan on each.

No purchases are required to review the app. There is no user-generated public
content and no ads or third-party tracking.

## Contact
Developer contact: darkarchonful@gmail.com

---

### Internal notes (do NOT paste into ASC)
- Demo bypass is env-gated: `DEMO_EMAIL` + `DEMO_CODE` in `k3s/30-api.yaml`
  (API v30). Skips email send + accepts the fixed code. **Remove post-launch.**
- Re-seed any time with `scripts/demo_seed.sql` — it resets the demo couple's
  swipes/plans/memories cleanly:
  `kubectl -n warmth exec -i postgres-warmth-0 -- psql -U warmth -d warmth < scripts/demo_seed.sql`
- IMPORTANT: seed keeps **2 open plans** on purpose — the deck blocks at **3+**
  non-done plans (`/activities/next`). Don't add a third open plan or the
  reviewer can't swipe.
- The reviewer's own right-swipes won't create new plans (a match needs the
  partner to also like the card), so the count stays at 2 during review.
- If the deck ever shows "no more activities", re-run the seed to reset swipes.
