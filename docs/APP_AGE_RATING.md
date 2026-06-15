# Warmth — Age Rating Questionnaire (App Store Connect answers)

Paste-ready answers for **ASC → App Information → Age Rating → Edit**. Apple's
current questionnaire (2025+ system, age bands **4+ / 9+ / 12+ / 16+ / 18+**).
Warmth is a wholesome date-ideas app for couples; the only "edge" is that it is
romantic and lets two paired partners exchange comments (user-generated content).

> **Target outcome: 12+** — driven by mild romantic/suggestive themes + the
> user-to-user communication feature. Nothing here justifies 16+/18+.

---

## Content descriptors — recommended answers

| Questionnaire item | Answer | Why |
|---|---|---|
| Cartoon or Fantasy Violence | **None** | No violence of any kind. |
| Realistic Violence | **None** | — |
| Prolonged Graphic / Sadistic Realistic Violence | **None** | — |
| Sexual Content or Nudity | **None** | App content is date ideas; no sexual content, no nudity. Card art is non-explicit and faces are hidden. |
| Graphic Sexual Content & Nudity | **None** | — |
| Profanity or Crude Humor | **None** | App ships no profanity. (UGC is private 1:1 — see note below.) |
| Alcohol, Tobacco, or Drug Use or References | **None** | A "have a glass of wine together"-style date idea is incidental; if a reviewer flags it, **Infrequent/Mild** is the fallback. Default **None**. |
| Mature / Suggestive Themes | **Infrequent/Mild** | It's a romantic couples app (dates, intimacy, "make memories"). Mild and non-explicit. This is the main driver toward 12+. |
| Horror / Fear Themes | **None** | — |
| Medical / Treatment Information | **None** | — |
| Gambling (simulated) | **None** | — |
| Contests | **None** | — |
| Unrestricted Web Access | **No** | No in-app browser / open web view. |

## Interaction & distribution questions (newer ASC items)

| Item | Answer | Note |
|---|---|---|
| **Does your app contain user-generated content?** | **Yes** | Partners write plan/memory notes and exchange comments. |
| **Does your app allow users to communicate?** | **Yes** | Comment threads between the two paired partners only (private, 1:1). |
| Capabilities to moderate UGC (report / block / filter) | Be ready to confirm | Content is visible **only to the one paired partner** — not public. See compliance note. |
| Is the app a medical/health app? | **No** | — |
| Does the app include in-app purchases? | **Yes (planned)** | Premium subscription via Apple IAP (Armenia launch). Set when IAP is configured. |
| Made for Kids / Kids Category? | **No** | App is intended for adults in relationships. |
| Gambling, contests, or real-money gaming | **No** | — |

---

## Expected result
With **Mature/Suggestive Themes = Infrequent/Mild** and everything else None, and
the communication feature declared, Apple lands the app at **12+**. If you set
Alcohol references to Infrequent/Mild it stays 12+. Nothing pushes it to 16+/18+
unless sexual content were declared (it is not).

## UGC compliance note (Guideline 1.2 — avoid a rejection)
Because the app has user-to-user communication, Apple expects basic safeguards.
Warmth's exposure is low (content is private to a single paired partner, never a
public feed), but confirm before submit that the build has:
- [ ] A way to **unpair** (cuts off the other person's content) — ✅ shipped (Settings → unpair)
- [ ] **Account deletion** — ✅ shipped
- [ ] A path to **report/contact** for abuse — Support page lists `darkarchonful@gmail.com` (✅). Consider an in-app "report partner / contact support" link before public launch if a reviewer pushes on 1.2.
- [ ] Terms/EULA noting zero tolerance for objectionable content (standard Apple EULA covers this unless a custom EULA is provided).

## Cross-checks before submitting
- [ ] Re-confirm IAP answer once StoreKit products exist (Armenia)
- [ ] Age rating saved as **12+**
- [ ] Matches the romantic-but-clean positioning in `docs/APP_STORE_LISTING.md`
