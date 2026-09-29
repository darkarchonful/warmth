# Warmth — Card Image TODO (current missing set)

**DONE 2026-09-17 — every deck card has art (261 of 261 as of 2026-09-29).** Nothing left to generate (exactly the activities where image_url IS NULL). Prompts rewritten 2026-09-11 for variety — each scene has its own setting, camera angle and light so the cards stop looking alike. Includes the 5 new activities added 2026-09-14 (ids 256–260). Done + removed from this list: 96, 99, 243, 101, 102, 103, 104, 178, 182, 219, 260, 105, 246, 121, 120, 117, 223, 174, 119, 257, 152, 247, 239, 118, 236, 108, 107, 109, 112, 222, 113, 110, 106, 111, 229, 122, 124, 125, 127, 128, 129, 130, 131, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 151, 155, 156, 158, 159, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 213, 224, 226, 228, 232, 238, 250, 253, 258, 259, 98, 100, 114, 115, 116, 153, 157, 179, 180, 181, 217, 221, 227, 230, 233, 234, 237, 240, 244, 245, 249, 256, 150, 214. Removed from the deck instead of getting art (snapshot in `docs/removed_activities_2026-09-17.csv`): 132, 160, 215 (123 and 126 were restored on 2026-09-23 with a still + looping clip, migration 043).

## How to use
1. Append your **`--sref <url>`** and **`--oref <url>`** to every prompt — the weights (`--sw 500 --ow 50`), `--ar 3:4` and `--v 7` are already on each line — so new cards share the palette/finish and the same couple.
2. Generate (3:4 portrait) → upscale → export. Drop the raw export as-is into **`api/public/activities/photo/`** (video clips into `video/`) — I center-crop to 600×600 and name it `<id>.jpg`.
3. Ping me — I crop, bake into the `warmth-media` image, roll it out and wire `image_url` (`scripts/wire_activity_images.sh`). Cards appear automatically — no app or API rebuild.

You can do these in batches — every finished `<id>.jpg` shows up after the next wire+deploy, so we don't have to wait for all of them.

## Why they looked the same before
Every old prompt was `<5-word scene> + <30 words of identical boilerplate>`, so Midjourney drew the boilerplate. These rewrites put the specific scene first and vary the **camera angle** (behind / overhead / close-up on hands / silhouette / over-shoulder / wide) and **light/time of day** card to card. The faces-unseen look is kept through composition, not a repeated phrase.

## Tips for more variety
- The `--sref` locks the palette and finish (good for cohesion). If cards still feel too uniform, lower the `--sw 500` on the line to **200–400** (lower = looser style adherence).
- Add **`--chaos 12`** to get four more different options per grid.
- Each prompt already names a camera angle — if two finished cards still rhyme, swap one's angle (e.g. "seen from behind" → "overhead top-down").


---

## New cards proposed 2026-09-17
Added while the app is in App Store review, so they go into the database **together with their art** (a card without art would show a placeholder to the reviewer). Ids are assigned at insert time; I match the exports by title.


## Batch one — remaining cards (37 of 53 went live 2026-09-29 as ids 262–298, media v9)
Road to 500 (224 today). Weighted to the thin categories: Daily 11, Chill 10, Romance 10, Seasonal 10, Food 4, Sporty 3, Adventures 1, Creative 1. Plus the 3 cards drafted on 09-17 above (Karaoke night, Cooking class for two, Speedboat ride) = 53 for this batch. Cross out what you dislike; generate the rest with your `--sref`/`--oref`; I match exports by title, insert the card WITH its art and wire it. Machine-readable copy: `docs/cards_batch1.csv`.

### Daily
**Water the plants together** (Daily · all · difficulty 1 · "Small green things") — two pairs of hands with a small watering can and a mister over windowsill plants, sun through the glass, water droplets catching light, close-up, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
### Chill
**Afternoon nap together** (Chill · all · difficulty 1 · "Curtains half drawn") — a bed by a window with curtains half drawn, two people asleep under a light blanket seen from behind and above, warm afternoon stripes of light, faces buried in pillows, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
### Romance
**Write on the steamed mirror** (Romance · all · difficulty 1 · "Steam reveals it") — a fogged bathroom mirror with 'I love you' written by a finger, one hand finishing the last letter, warm bathroom light, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
### Seasonal
**Plant bulbs for spring** (Seasonal · autumn · difficulty 1 · "Plant now, bloom later") — two pairs of gloved hands pressing tulip bulbs into dark soil in a garden bed, a trowel and a paper bag of bulbs, autumn light, close-up, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**Sunflower field afternoon** (Seasonal · summer · difficulty 2 · "Taller than you") — a couple seen from behind walking hand in hand between rows of tall sunflowers, bright summer sky, straw hats, wide shot, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**Snowball fight** (Seasonal · winter · difficulty 1 · "Truce at dusk") — two people mid snowball fight in a snowy park seen from behind, snow flying, bright coats, low winter sun, playful motion, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**Ice cream on the first warm day** (Seasonal · spring · difficulty 1 · "Coats open, cones out") — two people on a bench with ice cream cones seen from behind, coats unzipped, bare trees just budding, bright spring light, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
### Food
**Cook with only what's in the fridge** (Food · all · difficulty 2 · "No shopping, all in") — an open fridge with a few odd ingredients on the counter in front, two pairs of hands sorting them, kitchen light, overhead, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**Breakfast for dinner** (Food · all · difficulty 1 · "Pancakes at 8pm") — a dinner table at night with a stack of pancakes, bacon, orange juice and a candle, two hands pouring syrup, warm evening light, overhead, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**Dumplings from scratch** (Food · all · difficulty 3 · "Fold, pinch, repeat") — close-up of four floury hands folding dumplings on a wooden board, a tray of finished ones, a bowl of filling, warm kitchen light, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**Street food night out** (Food · all · difficulty 2 · "One stall each, share") — a couple seen from behind at a lively night food market, string lights, steam rising from a stall, paper plates in hand, warm colours, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
### Sporty
**Afternoon on the slopes** (Sporty · winter · difficulty 4 · "One lift, many laps") — two skiers seen from behind on a chairlift above a snowy slope, skis dangling, bright winter sun, mountains ahead, goggles up, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**Frisbee in the park** (Sporty · spring, summer, autumn · difficulty 1 · "Throw, run, miss, laugh") — a frisbee mid-flight between two people on a wide green lawn, seen from the side at a distance, late afternoon sun, one person leaping, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**Climb the tallest stairs in town** (Sporty · all · difficulty 2 · "Count the steps") — two people climbing a long outdoor stone staircase seen from behind, city rooftops opening up below, morning light, wide shot, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
### Adventures
**Night walk with headlamps** (Adventures · autumn, winter · difficulty 2 · "Same path, new dark") — two headlamp beams cutting through a dark forest path, two figures seen from behind, mist in the light, deep blue night, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
### Creative
**Build a birdhouse together** (Creative · spring · difficulty 2 · "Hammer, paint, hang") — four hands painting a small wooden birdhouse on a workbench, paint pots, a hammer and nails, garden light through a shed window, close-up, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

_No other cards pending. When new activities are added, list them here as `**<id>.jpg** — Title — prompt --ar 3:4 --sw 500 --ow 50 --v 7`._
