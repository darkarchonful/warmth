# Warmth — Card Image TODO (current missing set)

**7 cards still need Midjourney art** — synced to the live DB 2026-09-17 (exactly the activities where image_url IS NULL). Prompts rewritten 2026-09-11 for variety — each scene has its own setting, camera angle and light so the cards stop looking alike. Includes the 5 new activities added 2026-09-14 (ids 256–260). Done + removed from this list: 96, 99, 243, 101, 102, 103, 104, 178, 182, 219, 260, 105, 246, 121, 120, 117, 223, 174, 119, 257, 152, 247, 239, 118, 236, 108, 107, 109, 112, 222, 113, 110, 106, 111, 229, 122, 124, 125, 127, 128, 129, 130, 131, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 151, 155, 156, 158, 159, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 213, 224, 226, 228, 232, 238, 250, 253, 258, 259, 98, 100, 114, 115, 116, 153, 157, 179, 180, 181, 217, 221, 227, 230, 233, 234, 237, 240, 244, 245, 249, 256.

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

## Creative  (1)
**215.jpg** — Thrift-store outfit challenge — inside a vintage clothing shop, two people holding quirky outfits up to each other among crowded racks, seen from the side, colorful garments, mixed fluorescent-and-daylight, playful, a face hidden behind a raised hanger, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Food  (1)
**214.jpg** — Blind taste test — one person blindfolded at a kitchen table tasting a snack offered on a spoon by the other, seen from the side, little bowls of mystery snacks, playful, warm light, the blindfold hiding the eyes, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Romance  (3)
**123.jpg** — Candlelit bath together — a candlelit bathroom, two close silhouettes surrounded by many flickering candles and rose petals, warm light, rising steam, modest and abstract, faces in shadow, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**126.jpg** — Slow morning in bed with coffee — a couple lounging in bed with coffee mugs, seen from the side among white sheets in soft golden window light, a lazy embrace, a face turned into a pillow, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**160.jpg** — Winter stargazing — two people lying on a blanket in the snow under a starry sky, seen from directly above, bundled in coats, breath fogging, deep blue night with warm skin tones, tiny against the stars, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Seasonal  (1)
**132.jpg** — Make snow angels — two people lying in fresh snow making snow angels, seen from directly above, arms spread wide, coats and scarves, bright white snow with warm accents, playful, wide top-down, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Travel  (1)
**150.jpg** — Spa weekend together — two people lying side by side on spa tables with towels and hot stones, seen from above, candles and eucalyptus sprigs, warm soft light, serene, faces down on the headrests, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
