# Warmth — Card Image Prompts (Midjourney)

Generated for the **143 activities still missing card art** (ids > 80; the first 80
already have images, made in Midjourney). Excludes the `Test20` junk activity (id 183 — delete it).

## How to use
1. **Match the existing 80.** Append your original style reference to every prompt
   (e.g. `--sref <your code>` and `--v 6`) so the new cards look identical to the first set.
   The style line below approximates the look (painterly photo, couple in-scene, faces unseen)
   but your `--sref` is what guarantees consistency.
2. Generate each prompt, upscale, export **square**.
3. Name the file **`<id>.jpg`** (e.g. `82.jpg`) and drop it in `api/public/activities/`.
4. Run `scripts/wire_activity_images.sh` — it sets `image_url` for every id that now has a file.
5. Rebuild + deploy the API (images are baked into the image): `docker build` → push → bump → rollout.
   No app rebuild needed — the app just reads `image_url`.

## Shared style line (append to every prompt, plus your --sref)
```
candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw
```

---

## Adventures

**82.jpg** — Cave exploration tour — Walk into the earth together, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**83.jpg** — White-water rafting — Paddle through the rush, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**84.jpg** — Paragliding tandem — Float above it all, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**85.jpg** — Mountain biking trail — Wheels, dirt, laughter, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**86.jpg** — ATV ride through nature — Dust and speed together, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**87.jpg** — Kite flying at the coast — Wind in your hands, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**88.jpg** — Via ferrata route — Climb side by side, secured, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**89.jpg** — Jetski adventure — Salt spray, shared speed, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**173.jpg** — Cabin weekend — Off-grid, just the two of you, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**175.jpg** — Stargaze one night — Lights off, blanket out, look up, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**216.jpg** — Sunrise coffee up high — Set the alarm, watch it rise, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**220.jpg** — Be tourists in your own city — Do the touristy thing at home, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**231.jpg** — Snow picnic with a thermos — Cocoa out in the cold, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**242.jpg** — Go-kart grand prix — Winner picks the movie, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**243.jpg** — Axe-throwing night — Surprisingly great date, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**252.jpg** — Indoor skydiving — Two minutes of pure flight, outdoors, open and exhilarating, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw


## Chill

**81.jpg** — Random shopping together — No list, just wander and pick, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**90.jpg** — Jigsaw puzzle afternoon — Slow pieces, soft talk, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**91.jpg** — Slow pour-over coffee ritual — Watch it bloom together, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**92.jpg** — Rainy day on the couch — Let the world pause, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**93.jpg** — Board game night — Lose on purpose sometimes, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**94.jpg** — Scroll through old photos — Remember the small moments, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**95.jpg** — Face masks side by side — Silly look, real calm, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**96.jpg** — Bubble bath with music — Warm water, slow songs, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**97.jpg** — Watch a documentary together — Learn something side by side, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**154.jpg** — Watch snow fall with tea — No agenda, just quiet, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**176.jpg** — Read one chapter aloud — One of you reads, the other listens, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**177.jpg** — No-phone dinner — Both phones in another room, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**218.jpg** — Two-hour no-phone walk — New streets, no map, no phones, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**225.jpg** — Blanket fort movie night — Blankets, fairy lights, one film, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**235.jpg** — Indoor camping with string lights — Camp without the cold, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**241.jpg** — Cozy movie marathon — Pajamas, popcorn, no plans, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**248.jpg** — Co-op campaign night — One controller each, beat the boss, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**251.jpg** — Arcade tournament night — Tokens, high scores, trash talk, relaxed and cozy, soft and unhurried, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw


## Creative

**98.jpg** — Make pasta from scratch — Flour everywhere, perfect mess, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**99.jpg** — Plant a small herb garden — Something you'll grow together, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**100.jpg** — Learn calligraphy basics — Slow ink, steady hands, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**101.jpg** — Try a magic trick each — Fool each other, laugh anyway, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**102.jpg** — Origami challenge — Paper, patience, pride, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**103.jpg** — Build a blanket fort — Return to being children, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**104.jpg** — Make a shared photo album — Curate your year, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**105.jpg** — Write a joint bucket list — Dreams on one page, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**153.jpg** — Gingerbread house together — Sticky fingers, sweet chaos, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**178.jpg** — Learn a dance together — Pick one, practice for a week, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**179.jpg** — Pick the song — Three minutes, pick together, no second-guessing, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**180.jpg** — Practice one minute before dinner — Tiny daily rep, five days, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**181.jpg** — Film one take — Phone on the counter, one try, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**182.jpg** — Show someone — A friend, a parent, a camera roll post, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**215.jpg** — Thrift-store outfit challenge — Fifteen euros, dress each other, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**219.jpg** — Write each other a user manual — How to love me when I'm stressed, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**221.jpg** — Pottery class for two — Make a mess, make a bowl, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**233.jpg** — Decorate the place for the season — Make it all glow, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**234.jpg** — Handwrite cards to people you love — Slow down and mean it, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**237.jpg** — Frosty morning photo walk — Catch the light on the ice, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**240.jpg** — Build a winter playlist together — Songs for short days, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**244.jpg** — Escape room race — Beat the clock together, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**249.jpg** — Fly a drone in a field — Chase the aerial shot, hands-on and playful, making something together, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw


## Travel

**146.jpg** — Book a random Airbnb — Same country, new bed, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**147.jpg** — Airport with no destination picked — Board the next cheap flight, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**148.jpg** — Overnight bus to somewhere small — Wake up somewhere new, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**149.jpg** — Visit a lighthouse — Stand where land ends, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**150.jpg** — Spa weekend together — Warm stones, slow hours, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**151.jpg** — Foreign-language weekend — Stumble in a new tongue, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**159.jpg** — Ski weekend trip — Snow, lift, lodge, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**162.jpg** — Visit a new country — A trip somewhere neither of you has been, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**163.jpg** — Pack the night before — Lay it all out together — no last-minute panic, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**164.jpg** — Learn 5 phrases in the language — Hello, thank you, two beers please, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**165.jpg** — Map the must-sees — Pick three places each — compare lists, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**166.jpg** — Plan the first meal — Find the spot before you land, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**167.jpg** — Pick a keepsake to bring home — Something small, something you'll see daily, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**168.jpg** — Weekend road trip — Anywhere two tanks of gas gets you, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**169.jpg** — Make a road-trip playlist — One song each, take turns — no skipping, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**170.jpg** — Map three photo stops — Scenic lookouts, weird roadside signs, whatever, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**171.jpg** — Buy snacks for the drive — Grocery run, ten minutes, no planning, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**172.jpg** — Trade one memory per hour — A story from before you met, every hour on the road, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**230.jpg** — Plan next year's trips by the fire — Dream the year out loud, wanderlust, a strong sense of place and journey, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw


## Daily

**106.jpg** — Shower together — Warm water, no rush, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**107.jpg** — First hour of the day phone-free — Just us, slowly waking, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**108.jpg** — Compliment three small things — Notice out loud today, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**109.jpg** — Send a voice memo at noon — A minute of your voice, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**110.jpg** — Pack lunch for them — A small act of care, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**111.jpg** — Sit five minutes in silence — Eyes closed, close together, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**112.jpg** — Ask what's on their mind — Then really listen, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**113.jpg** — Drive somewhere without talking — Music and presence, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**222.jpg** — Couple's bucket-list night — Write thirty things to do together, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**229.jpg** — Winter farmers market morning — Warm hands around paper cups, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**245.jpg** — Build the flat-pack furniture — Survive it, laugh later, an intimate everyday moment at home, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw


## Romance

**122.jpg** — Write love letters and read aloud — Say it in ink first, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**123.jpg** — Candlelit bath together — Soft light, skin close, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**124.jpg** — Dance in the kitchen while cooking — Stir, sway, kiss, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**125.jpg** — Share your childhood photos — Meet the kid they were, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**126.jpg** — Slow morning in bed with coffee — No alarm, no agenda, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**127.jpg** — Compliment hour, only words — An hour of soft things, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**128.jpg** — Dress up for no reason — Look at each other again, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**129.jpg** — Sunset drive, windows down — Warm air, warmer hands, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**158.jpg** — Fireplace night with wine — Slow evening, soft light, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**160.jpg** — Winter stargazing — Crisp sky, cold noses, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**161.jpg** — New Year's countdown kiss — Begin it right, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**213.jpg** — Pick out a scent together — Choose a fragrance for each other, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**228.jpg** — Mulled wine on the balcony — Spiced, steaming, just you two, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**238.jpg** — Winter spa night at home — Robes, candles, no rush, tender and intimate, soft golden light, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw


## Seasonal

**130.jpg** — Pumpkin carving together — Silly faces, real fun, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**131.jpg** — Summer lake day — Splash, float, nap, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**132.jpg** — Make snow angels — Fall backwards, laugh up, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**133.jpg** — Spring cleaning as a team — Lighten the house together, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**134.jpg** — Rooftop fireworks night — Lights over the city, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**135.jpg** — Apple picking orchard — Crisp air, full basket, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**136.jpg** — Winter soup and a movie — Warm bowl, warm blanket, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**137.jpg** — Cherry blossom walk — Pink sky, slow steps, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**155.jpg** — Holiday lights walk — Bundled up, glowing streets, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**156.jpg** — Build a snowman — Classic, silly, required, seasonal atmosphere, evocative weather, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw


## Food

**114.jpg** — Homemade pizza night — Your dough, your toppings, your pie, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**115.jpg** — Brunch at a new spot — A Sunday tradition starts here, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**116.jpg** — Ice cream stand crawl — Three scoops, three streets, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**117.jpg** — Coffee shop tour in your city — Cup by cup, together, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**118.jpg** — Taco night at home — Build, share, mess up, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**119.jpg** — Fondue evening — Dip, talk, repeat, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**120.jpg** — Chocolate tasting — Dark, milk, salted, sweet, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**121.jpg** — Bake fresh bread — Kneaded with patience, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**152.jpg** — Hot chocolate at a cozy cafe — Warm hands, warmer talk, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**174.jpg** — Cook something you never cook at home — The recipe you always scroll past, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**214.jpg** — Blind taste test — Five weird snacks, no peeking, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**217.jpg** — Cook their comfort dish — The recipe from their childhood, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**223.jpg** — Cook a farmers-market haul — Buy it fresh, make it together, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**227.jpg** — Bake cinnamon rolls from scratch — Fill the kitchen with warmth, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**236.jpg** — Two-pot soup cook-off — Two pots, one taste test, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**239.jpg** — Mix warm winter drinks — Hot toddies, cocoa, cider, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**246.jpg** — Backyard grill and a cold beer — Low, slow, smoky, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**247.jpg** — Hot wing challenge — Scoville ladder, milk on standby, warm, appetizing and inviting, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw


## Sporty

**138.jpg** — Table tennis evening — Fast hands, soft rivalry, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**139.jpg** — Pilates class together — Stretch side by side, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**140.jpg** — Boxing class for two — Gloves on, smile wider, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**141.jpg** — Run a 5k as a team — Same pace, same breath, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**142.jpg** — Hike in the rain — Wet boots, bright mood, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**143.jpg** — Bowling night — Gutter balls and high-fives, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**144.jpg** — Mini-golf round — Windmills and kisses, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**145.jpg** — Trampoline park hour — Bounce until you're kids again, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**157.jpg** — Sledding afternoon — Kid-mode, full speed, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**224.jpg** — Sunset bike ride — Two wheels, golden hour, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**226.jpg** — Ice skating hand in hand — Wobble together, laugh a lot, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**232.jpg** — Sauna and cold plunge together — Heat, shock, a shared gasp, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**250.jpg** — Darts best of five — Bullseye for bragging rights, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

**253.jpg** — Archery range day — Loose an arrow, find your aim, active, energetic and lively, candid couple together, often seen from behind or to the side with faces unseen, natural soft light, muted warm cinematic palette, gentle painterly photo-illustration finish, fine film grain, intimate and cozy mood --ar 1:1 --style raw

