# Warmth — App Privacy "Nutrition Label" (App Store Connect answers)

Paste-ready answers for **App Store Connect → App Privacy**. Source of truth is
`api/public/privacy.html`. This app uses **no third-party analytics, no ads, no
tracking SDKs, and no precise location** — confirmed by code audit (no Sentry /
Amplitude / Mixpanel / Facebook / AdMob / expo-tracking in the bundle).

> **Headline answers**
> - "Do you or your third-party partners collect data from this app?" → **Yes**
> - "Is data used to track users?" (across other companies' apps/sites for ads) → **No** — nothing is in the *Tracking* bucket.
> - We declare data as **Linked to the user** (it ties to an account), **App Functionality only**, **not used for tracking**.

---

## Step 1 — Data types collected

Select **Yes, we collect data**, then check exactly these types:

| ASC category | Data type | Collected? | Notes |
|---|---|---|---|
| Contact Info | **Email Address** | ✅ | Account identifier / email sign-in. |
| Contact Info | **Name** | ✅ | Display name the user chooses. |
| User Content | **Photos or Videos** | ✅ | Optional avatar image only. |
| User Content | **Other User Content** | ✅ | Swipes, plans, memories, ratings, notes, comments. |
| Identifiers | **User ID** | ✅ | Internal account id + Google/Apple sign-in identifier (sub). |
| Sensitive Info | **Sensitive Info** | ✅ | Optional **gender** field → Apple classifies gender as Sensitive Info. |
| Contacts | — | ❌ | Not collected. |
| Health & Fitness | — | ❌ | Not collected. |
| Financial Info | — | ❌ | No payments handled by the app; Apple handles any future IAP. |
| **Location** | — | ❌ | **No** precise or coarse location. Time zone (from device) is a string preference, not a Location data type — do **not** check Location. |
| Browsing / Search History | — | ❌ | Not collected. |
| Diagnostics (crash/performance) | — | ❌ | No analytics or crash SDK. |
| Usage Data (product interaction) | — | ❌ | No analytics SDK; in-app activity is User Content, declared above. |
| Identifiers — Device ID | — | ❌ | Push token is delivery infrastructure, not declared as Device ID. |

> **Push token note:** Apple does not have a dedicated "push token" data type. It
> is used solely to deliver notifications (App Functionality) and is not an
> advertising/device identifier. No separate declaration required; it is covered
> under App Functionality use. If a reviewer asks, it maps to "Other Data Types"
> used for App Functionality, not linked to tracking.

## Step 2 — For EACH data type above, answer the three sub-questions

Apply the **same answers to every collected type**:

1. **Is this data used to track you?** → **No** (for all).
2. **Is this data linked to your identity?** → **Yes** (all of it ties to the account).
3. **Purposes** → check **App Functionality** only.
   - Do **not** check Analytics, Product Personalization, Advertising, or Developer's Marketing.

### Per-type purpose detail (all = App Functionality, Linked, Not used for tracking)
- **Email Address** — App Functionality (account, sign-in code delivery).
- **Name** — App Functionality (display to partner).
- **Photos or Videos** (avatar) — App Functionality.
- **Other User Content** — App Functionality (shared deck/plans/memories/comments).
- **User ID** — App Functionality (authentication, pairing).
- **Sensitive Info** (gender, optional) — App Functionality.

## Step 3 — Tracking section
- **"Does this app track users?"** → **No.**
- No `App Tracking Transparency` prompt is required (we never access the IDFA and
  never share data with data brokers for advertising).

---

## One-paragraph summary for internal reference
Warmth collects email, display name, an optional avatar photo, optional gender,
an internal/SSO user identifier, and user-generated couple content (swipes,
plans, memories, comments). All of it is **linked to the user** and used **only
for app functionality** — never for tracking, advertising, analytics, or
profiling. No location, no third-party trackers, no ad identifiers. A device push
token is stored only to deliver notifications the user opts into.

## Cross-checks before submitting
- [ ] Privacy Policy URL set in ASC → `https://warmth-api.dbtvault-solutions.tech/privacy`
- [ ] Answers above match the live privacy.html data inventory
- [ ] Tracking = No (no ATT prompt in the build)
- [ ] If real IAP is added later (Armenia), revisit **Financial Info** / **Purchases** declarations
