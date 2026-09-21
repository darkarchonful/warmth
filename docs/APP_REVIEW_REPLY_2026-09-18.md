# App Review reply — Guideline 2.1 Information Needed (received 2026-09-18)

Apple's standard request for developer accounts with limited review history. **Not a
rejection of the app and no new build is needed.** Reply in App Store Connect → App Review
with the screen recording attached and the text below, then paste the same text into
**App Review Information → Notes** for future submissions.

---

## PART A — Text to paste into the reply (items 2–6)

Hello, thank you for the review. The requested information is below and a screen recording is attached.

**1. Screen recording**
Attached. Recorded on a physical iPhone running the current iOS version. It starts with launching the app and shows: sign-in with the demo account, the swipe deck, a shared plan with its comment thread, a memory with a photo, Settings (support, report, unpair), then log out, registration of a brand-new account by email, and in-app account deletion (Settings → Delete account).

**2. Purpose and target audience**
Warmth is a private app for two people in a relationship. It solves a common problem: couples fall into routine and struggle to agree on what to do together. Each partner privately swipes through a deck of date and activity ideas. Only when both partners like the same idea does it become a shared Plan, so nobody has to propose something and risk a no. Partners confirm the plan, do it, mark it done, and it becomes a Memory with optional photos and notes. Gentle reminders help the couple follow through. The audience is adult couples; the app is rated 13+. It is not a social network and never connects strangers: every account is linked to exactly one partner through a private invite code.

**3. Setup and access**
Sign-in: on the welcome screen choose "Email".
- Email: appreview@warmth.dbtvault-solutions.tech
- Login code: 473829 (fixed code for review; no email is sent for this account)

This demo account is already paired with a partner and pre-loaded with content, so the full experience can be reviewed on one device:
- Home (deck): swipe right to like an idea, left to pass.
- Plans: one confirmed plan and one awaiting confirmation. Open a plan to see the comment thread between partners.
- Memories: one completed activity with ratings and notes; photos can be added.
- Settings (top of the deck): name, unpair, contact support, report a problem or content, privacy policy, log out, delete account.

Optional second account, to see a live match across two devices:
- Email: appreview.partner@warmth.dbtvault-solutions.tech, login code 473829.
Like the same idea on both accounts and it appears as a shared Plan on each.

In normal use one partner shares an invite code from the app and the other enters it. Sign in with Apple and Google sign-in are also available; neither is needed for review. There are no purchases, subscriptions or paid features in this version.

**4. External services**
- Sign in with Apple and Google Sign-In: authentication only.
- Resend (transactional email): delivers the one-time login code for email sign-in.
- Apple Push Notification service, via Expo's push service: notifications such as "You matched" or a new partner comment.
- Expo Application Services (EAS Update): delivers JavaScript bug-fix updates.
- Our own backend: a Node.js API with a PostgreSQL database on servers we operate. All account data, plans, comments and photos are stored there.
The app uses no analytics or advertising SDKs, no third-party tracking, no payment processor and no AI services.

**5. Regional differences**
None. The app works identically in every region. The interface is in English. The only variation is that seasonal ideas (for example winter activities) are shown according to the calendar month, the same way for all users.

**6. Regulated industries and third-party material**
Not applicable. The app does not operate in a regulated industry. All activity ideas and texts are written by us, and all card illustrations were created by us for this app. The app contains no licensed or third-party protected content.

**User-generated content**
Content created in the app (custom activity ideas, comments, photos and notes) is visible only to the two partners of one couple. There is no public feed, no search, and no way to contact or see any other user. Because of this private one-to-one design:
- Blocking: "Unpair" in Settings immediately ends the connection, removes the partner's access and deletes all shared content. A person can only be paired by entering an invite code themselves.
- Reporting: Settings → "Report a problem or content" and "Contact support" show our support address and open an email to us or our support page. We respond to reports within 24 hours.
- Account deletion: Settings → Delete account permanently removes the account and all associated data. Settings is reachable both from the deck (paired accounts) and from the pairing screen (accounts that are not paired yet).

Contact: warmth@dbtvault-solutions.tech

---

## PART B — Screen recording shot list (item 1)

Apple's rules for the recording: **physical iPhone**, **latest iOS** (update the phone first if an update is pending), and it **must begin with launching the app**. Aim for 3–4 minutes. No narration needed.

**Before recording**
1. Open Warmth once with the VPN off, close it, open it again, so the latest update (with the new Help section in Settings) is applied.
2. Log out of your own account (Settings → Log out) so the app starts on the welcome screen.
3. Prepare a throwaway address for the registration part, e.g. `darkarchonful+review1@gmail.com` (Gmail delivers +aliases to your normal inbox). Keep Mail ready for the code.
4. Turn on Do Not Disturb so no private notifications appear in the video.
5. Swipe the app away so it is fully closed. Start iOS screen recording (Control Center), then go to the Home Screen.

**Recording**
1. Tap the Warmth icon (launch). Pause a second on the welcome screen so Apple / Google / Email options are visible.
2. Email → `appreview@warmth.dbtvault-solutions.tech` → code `473829` → deck appears.
3. Deck: swipe left once, right twice; tap a card to show its detail.
4. Plans: open "Cook dinner together" → show the comment thread → type and send one short comment.
5. Memories: open the memory → show ratings/notes → add a photo from the library.
6. Settings: scroll slowly top to bottom so Name, Pairing/Unpair, Help (Contact support, Report a problem or content, Privacy policy), Log out and Delete account are all visible. Tap **Report a problem or content**: a dialog shows the support address — pause a second, then tap **Open support page** (or Cancel) and return to the app. Do NOT tap "Open mail app" on a phone without a configured mail app (iOS may open an unrelated app). Then tap Unpair, show the confirmation, tap **Cancel**.
7. Log out (confirm).
8. Registration: Email → your throwaway address → switch to Mail, read the code, switch back, enter it → complete the name/intro screens → the pairing screen with "Share this code" appears. Pause there a moment (it shows how partners connect).
9. On the pairing screen tap **Settings** (top right corner) → **Delete account** → confirm → the app returns to the welcome screen. Stop recording. (A new account is not paired yet, so Settings is reached from the pairing screen, not from the deck.)

**After recording**
- Do NOT unpair or delete the demo account itself — only the throwaway one.
- Trim the start/end in Photos if needed (keep the app launch in).
- Attach the video to the App Review reply. If the upload is rejected for size, upload it as an unlisted YouTube video or an iCloud link and paste the link into the reply.
- Afterwards ask Claude to re-seed the demo couple (`scripts/demo_seed.sql`), which removes the test comment and photo so the account is clean for the reviewer.
