# Warmth — Card Image TODO (current missing set)

**29 cards still need Midjourney art** — synced to the live DB 2026-09-14 (exactly the activities where image_url IS NULL). Prompts rewritten 2026-09-11 for variety — each scene has its own setting, camera angle and light so the cards stop looking alike. Includes the 5 new activities added 2026-09-14 (ids 256–260). Done + removed from this list: 96, 99, 243, 101, 102, 103, 104, 178, 182, 219, 260, 105, 246, 121, 120, 117, 223, 174, 119, 257, 152, 247, 239, 118, 236, 108, 107, 109, 112, 222, 113, 110, 106, 111, 229, 122, 124, 125, 127, 128, 129, 130, 131, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 151, 155, 156, 158, 159, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 213, 224, 226, 228, 232, 238, 250, 253, 258, 259.

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

## Creative  (14)
**98.jpg** — Make pasta from scratch — close-up of four floury hands stretching a sheet of fresh pasta over a wooden board, flour dust in the air, a rolling pin and egg yolks nearby, sunlit kitchen counter, shot from above, faces out of frame, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**100.jpg** — Learn calligraphy basics — extreme close-up of one hand guiding another that holds a dip pen mid-stroke on cream paper, a bottle of black ink and practice sheets, warm desk-lamp pool, shallow focus, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**153.jpg** — Gingerbread house together — close-up of hands piping white icing onto a gingerbread house, candy decorations and a piping bag, a flour-dusted table, warm kitchen glow at night, overhead angle, faces out of frame, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**179.jpg** — Pick the song — close-up of two hands scrolling a phone music app together on a couch, vinyl records and a turntable nearby, warm evening lamp, shallow focus on the screen glow, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**180.jpg** — Practice one minute before dinner — a couple doing a quick dance turn in the kitchen while a pot simmers, seen from behind, apron strings and rising steam, golden-hour light through the window, candid mid-motion, faces unseen, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**181.jpg** — Film one take — over-the-shoulder view of a phone on a kitchen-counter tripod filming two people dancing in the background, soft bokeh, warm domestic light, the couple slightly out of focus and faceless, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**215.jpg** — Thrift-store outfit challenge — inside a vintage clothing shop, two people holding quirky outfits up to each other among crowded racks, seen from the side, colorful garments, mixed fluorescent-and-daylight, playful, a face hidden behind a raised hanger, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**221.jpg** — Pottery class for two — two people at a pottery wheel, four muddy hands shaping a clay bowl together, water and clay spatter, studio shelves of pots behind, warm side light, close three-quarter view, faces unseen, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**233.jpg** — Decorate the place for the season — a couple hanging string lights and garlands across a living room, one on a step-stool seen from behind handing decorations down, open boxes of ornaments, warm evening glow, faces unseen, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**234.jpg** — Handwrite cards to people you love — overhead of hands writing greeting cards at a table covered in envelopes and stamps, a stack of sealed cards and a mug, soft daylight, top-down flat-lay, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**237.jpg** — Frosty morning photo walk — two people in coats photographing frost-covered branches in a park, seen from behind, breath fogging the air, one raising a camera, pale winter sun, muted blues with warm skin tones, wide shot, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**240.jpg** — Build a winter playlist together — a couple under a blanket on the floor by a record player, sharing a pair of headphones, seen from the side, vinyl sleeves spread out, warm lamp, snow at the window, faces turned down, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**244.jpg** — Escape room race — two people in a dim themed escape room inspecting a puzzle box and clues on a wall, seen from behind, a ticking clock and red accent lighting, dramatic shadows, tense and playful, faceless, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**249.jpg** — Fly a drone in a field — a couple standing in a wide green field at dusk seen from behind, one holding a controller as a small drone hovers ahead, long grass, golden-pink sky, tiny figures in a big landscape, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Daily  (1)
**245.jpg** — Build the flat-pack furniture — two people on a living-room floor surrounded by flat-pack furniture parts, an instruction sheet and an allen key between them, seen from the side mid-assembly, cardboard everywhere, warm daylight, playful exasperation, faces down, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Food  (7)
**114.jpg** — Homemade pizza night — close-up of hands sliding a homemade pizza off a wooden peel, flour and fresh basil, a hot oven glowing behind, warm kitchen night light, high angle, faces out of frame, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**115.jpg** — Brunch at a new spot — a sunny café table seen from above, plates of eggs and pancakes, two coffees, a hand reaching across, bright morning light, top-down flat-lay with laps just in frame, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**116.jpg** — Ice cream stand crawl — a couple walking a summer street holding dripping ice-cream cones, seen from behind, pastel storefronts, warm sun, two cones raised, bright and playful, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**214.jpg** — Blind taste test — one person blindfolded at a kitchen table tasting a snack offered on a spoon by the other, seen from the side, little bowls of mystery snacks, playful, warm light, the blindfold hiding the eyes, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**217.jpg** — Cook their comfort dish — close-up of hands stirring a steaming pot of home-style stew, an old handwritten recipe card propped up behind, warm stovetop light, nostalgic, faces out of frame, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**227.jpg** — Bake cinnamon rolls from scratch — overhead of hands rolling cinnamon-sugar dough into a tight spiral on a floured counter, a swirl of cinnamon, warm kitchen light, top-down, no faces, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**256.jpg** — Cook over a bonfire — close-up of two hands roasting food on long sticks over a crackling bonfire at dusk, glowing embers and sparks rising, a cast-iron pan resting on the coals, warm orange firelight against deep blue evening, low angle, faces unseen, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Romance  (3)
**123.jpg** — Candlelit bath together — a candlelit bathroom, two close silhouettes surrounded by many flickering candles and rose petals, warm light, rising steam, modest and abstract, faces in shadow, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**126.jpg** — Slow morning in bed with coffee — a couple lounging in bed with coffee mugs, seen from the side among white sheets in soft golden window light, a lazy embrace, a face turned into a pillow, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**160.jpg** — Winter stargazing — two people lying on a blanket in the snow under a starry sky, seen from directly above, bundled in coats, breath fogging, deep blue night with warm skin tones, tiny against the stars, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Seasonal  (1)
**132.jpg** — Make snow angels — two people lying in fresh snow making snow angels, seen from directly above, arms spread wide, coats and scarves, bright white snow with warm accents, playful, wide top-down, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Sporty  (1)
**157.jpg** — Sledding afternoon — a couple sledding down a snowy hill on one toboggan, seen from behind racing downhill, snow spraying up, bright winter day, motion, backs to camera, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7

## Travel  (2)
**150.jpg** — Spa weekend together — two people lying side by side on spa tables with towels and hot stones, seen from above, candles and eucalyptus sprigs, warm soft light, serene, faces down on the headrests, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
**230.jpg** — Plan next year's trips by the fire — a couple on the floor by a fireplace with a world map and a laptop, seen from behind, mugs beside them, marking destinations, warm firelight, a cozy winter night, faces to the map, muted warm cinematic palette, soft painterly photo-illustration, fine film grain --ar 3:4 --sw 500 --ow 50 --v 7
