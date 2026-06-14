# Warmth — App Store Screenshot Plan

A capture-ready checklist. When you're on a device with the app running, follow
this top to bottom — each entry says **which screen, how to set it up, and the
caption text** to overlay. Goal is a coherent left-to-right story: *match → swipe
→ agree → plan → remember*.

## Technical requirements
- **Required size:** 6.7" iPhone — **1290 × 2796 px** (portrait). This is the one
  size App Store Connect mandates; it auto-scales down for smaller devices, so
  you only strictly need this set.
- **Optional but nice:** 6.9" (1320 × 2868) for the newest Pro Max — same shots.
- **Count:** 3 minimum, **up to 10**. Plan below is **6** (strong, not padded).
- **Format:** PNG or JPG, RGB, no alpha, no rounded corners (App Store frames it).
- **No status-bar clutter:** full battery, full signal, clean time (use a
  simulator/clean device; or capture then clean the status bar).
- **Use the demo/seeded couple** so screens are populated, not empty. Login
  `appreview@warmth.dbtvault-solutions.tech` (pre-paired with "Sam", has plans +
  a memory). That guarantees real-looking content. **Caveat:** card images are
  still being generated — shoot the swipe screen *after* at least the hero cards
  have real art, or it'll show emoji placeholders. (Ties to the card-images task.)

## Caption style
- Short, benefit-led, 3–5 words. Place caption in the **top ~20%**, app screen
  below. Warm palette: bg `#FDF6EE`, heading `#3D2C2C`, accent `#D4956A`.
- Keep one consistent template across all 6 (same font, same caption position).

---

## The 6 shots (in store order)

### 1. Hero — the swipe deck  ·  screen: `swipe.js`
- **Caption:** "Swipe on date ideas, together"
- **Setup:** logged in as the demo couple, deck showing a beautiful card with
  **real art** (pick the best-looking card — e.g. a Romance or Travel one).
  Mid-swipe tilt looks alive if you can catch it; otherwise a clean centered card.
- **Why first:** it's the visual identity of the app and the core verb.

### 2. The match moment  ·  screen: swipe match overlay / toast
- **Caption:** "Both said yes? It's a match"
- **Setup:** trigger the match animation/state (the moment both partners liked the
  same card → it becomes a plan). If hard to stage live, capture the match
  confirmation UI. Conveys the two-person magic.

### 3. Your shared plans  ·  screen: `checklist/index.js`
- **Caption:** "Turn ideas into real plans"
- **Setup:** demo account has 2 seeded plans (1 approved + 1 matched). Shows the
  list populated — proves it's not just swiping, there's follow-through.

### 4. A plan, with the checklist + comments  ·  screen: `checklist/[id].js`
- **Caption:** "Plan it, chat it, do it"
- **Setup:** open the seeded plan that has Sam's comment. Shows the checklist
  items + the comment thread = the collaboration feature.

### 5. Memories  ·  screen: `memories/index.js` or `memories/[id].js`
- **Caption:** "Keep the memories you make"
- **Setup:** the demo couple has 1 saved memory (activity 27) with a rating/note.
  Open the detail for the richer shot. The emotional payoff of the loop.

### 6. Pairing / invite  ·  screen: `index.js` (invite-code state)
- **Caption:** "Just the two of you"
- **Setup:** the invite/share-code screen (logged-in, unpaired state, or the
  "share your code" view). Communicates privacy + that it's a 1:1 couple app, not
  a social feed. Good closer.

---

## Capture workflow
1. Log in as the demo account on the device (pre-paired, populated).
2. Walk screens 1→6, screenshot each (Volume-Up + Side button).
3. Clean status bars if needed.
4. Add captions in the consistent template (Figma/Canva/Keynote — top band).
5. Export at 1290 × 2796, name `01-swipe.png` … `06-invite.png`.
6. Upload to ASC → App Store → Screenshots (6.7" slot), in this order.

## Pre-capture blockers
- [ ] Real card art on at least the hero card(s) used in shots 1–2 (card-images task)
- [ ] Demo account reachable on the capture device (it is, via env-gated login)
- [ ] Decide caption template once, reuse for all 6

## Notes
- Don't show the demo login credentials in any screenshot.
- If the match animation (shot 2) is too hard to stage, drop to 5 shots — quality
  over filling all 10. A weak screenshot hurts more than a missing one.
