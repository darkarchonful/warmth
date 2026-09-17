# Warmth — Card Image TODO (current missing set)

**7 cards still need Midjourney art** — synced to the live DB 2026-09-17 (exactly the activities where image_url IS NULL). Prompts rewritten 2026-09-11 for variety — each scene has its own setting, camera angle and light so the cards stop looking alike. Includes the 5 new activities added 2026-09-14 (ids 256–260). Done + removed from this list: 96, 99, 243, 101, 102, 103, 104, 178, 182, 219, 260, 105, 246, 121, 120, 117, 223, 174, 119, 257, 152, 247, 239, 118, 236, 108, 107, 109, 112, 222, 113, 110, 106, 111, 229, 122, 124, 125, 127, 128, 129, 130, 131, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 151, 155, 156, 158, 159, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 213, 224, 226, 228, 232, 238, 250, 253, 258, 259, 98, 100, 114, 115, 116, 153, 157, 179, 180, 181, 217, 221, 227, 230, 233, 234, 237, 240, 244, 245, 249, 256.

## How to use
1. Append your **`--sref <url>`** and **`--oref <url>`** to every prompt — the weights (`--sw 500 --ow 50`), `--ar 3:4` and `--v 7` are already on each line — so new cards share the palette/finish and the same couple.
2. Generate (3:4 portrait) → upscale → export. Drop the raw export as-is into **`api/public/activities/photo/`** (video clips into `video/`) — I center-crop to 600×600 and name it `<id>.jpg`.
3. Ping me — I crop, bake into the `warmth-media` image, roll it out and wire `image_url` (`scripts/wire_activity_images.sh`). Cards appear automatically — no app or API rebuild.

You can do these in batches — every finished `<id>.jpg` shows up after the next wire+deploy, so we don't have to wait for all of them.

## Why they looked the same before
Every old prompt was `<5-word scene> + <30 words of identical boilerplate>`, so Midjourney drew the boilerplate. These rewrites put the specific scene first and vary the **camera angle** (behind / overhead / close-up on hands / silhouette / over-shoulder / wide) and **light/time of day** card to card. The faces-unseen look is kept through composition, not a repeated phrase.

## Last 7 — rewritten 2026-09-17
These were the hardest scenes (bodies lying down, bath/bed/spa settings that trip the Midjourney filter, a blindfold). Each is now staged around objects, hands, or figures seen from behind. If a title word still gets blocked, paste the prompt starting after the title — I match files by content, not only by name.

## Tips for more variety
- The `--sref` locks the palette and finish (good for cohesion). If cards still feel too uniform, lower the `--sw 500` on the line to **200–400** (lower = looser style adherence).
- Add **`--chaos 12`** to get four more different options per grid.
- Each prompt already names a camera angle — if two finished cards still rhyme, swap one's angle (e.g. "seen from behind" → "overhead top-down").

---

## Creative  (1)
**215.jpg** — Thrift-store outfit challenge — a couple seen from behind at a tall mirror inside a cramped vintage clothing shop, one wearing an oversized retro blazer and a wide-brim hat, the other holding a loud patterned shirt on a hanger up against them, crowded colorful racks on both sides, warm tungsten bulbs, playful mood, faces hidden by the hat brim and the hanger, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Food  (1)
**214.jpg** — Blind taste test — overhead view of a kitchen table with six small numbered bowls of mystery snacks, one hand offering a spoon across the table, the other person covering their own eyes with one palm and reaching out with the other hand, a notepad with tally marks, warm pendant-lamp light, playful, framed from the shoulders down so no faces show, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Romance  (3)
**123.jpg** — Candlelit bath together — close-up of a vintage clawfoot tub brimming with thick white foam, a wooden tray across it holding two glasses and a small plate of strawberries, dozens of lit candles along the rim and the tiled floor, rose petals floating on the foam, two hands clinking glasses above the foam, soft rising steam, dark cozy room lit only by candlelight, only hands visible, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**126.jpg** — Slow morning in bed with coffee — overhead view of a rumpled white linen duvet, a wooden breakfast tray with two steaming coffee mugs and croissants, two pairs of feet in wool socks poking out from under the blanket, an open book and reading glasses, golden stripes of window light across the covers, lazy quiet weekend morning, no faces in frame, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**160.jpg** — Winter stargazing — two people bundled in thick coats and knit hats sitting close on a blanket on a snowy hilltop, seen from behind, a thermos and a small glowing lantern beside them, one arm raised pointing at the Milky Way, breath fogging, deep blue night with a warm lantern glow on their backs, tiny figures under a huge starry sky, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Seasonal  (1)
**132.jpg** — Make snow angels — high aerial view of two fresh snow-angel imprints side by side in untouched powder snow, two people in bright winter coats standing at the edge holding mittened hands and looking down at them, seen from above and behind, long blue afternoon shadows, footprints leading in, crisp white snow with warm color accents, playful, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Travel  (1)
**150.jpg** — Spa weekend together — two people in white robes and slippers seen from behind, sitting side by side on the stone edge of a steaming indoor thermal pool, cups of herbal tea and folded towels beside them, eucalyptus branches and candles along the wall, soft warm light on wet stone, serene and quiet, backs to camera, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
