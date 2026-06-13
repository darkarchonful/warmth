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
- **Plans:** two agreed plans ("Cook dinner together", "Watch the sunset
  together") and one awaiting confirmation ("Movie night at home"). Open the
  "Cook dinner together" plan to see the in-plan comment thread with the partner.
- **Memories:** one completed activity ("Morning coffee together") with both
  partners' ratings and notes.
- **Account controls:** Settings (top of the deck) includes **unpair** and
  **delete account**.

Pairing in normal use is done by one partner sharing an invite code and the
other entering it; since review is single-device, we have pre-paired the demo
account so this step is not required.

No purchases are required to review the app. There is no user-generated public
content and no ads or third-party tracking.

## Contact
Developer contact: darkarchonful@gmail.com

---

### Internal notes (do NOT paste into ASC)
- Demo bypass is env-gated: `DEMO_EMAIL` + `DEMO_CODE` in `k3s/30-api.yaml`
  (API v30). Skips email send + accepts the fixed code. **Remove post-launch.**
- Seed couple is id 66 (users 141 "Alex" / 142 "Sam"). Re-seed with
  `/tmp/demo_seed.sql` (or commit it) if the data drifts before submission.
- If the deck shows "no more activities", the demo account may have swiped
  through; re-run the seed to reset swipes.
