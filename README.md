# SLAB officials reveal

The pack opening the SLAB site plays for the **officials** (`Officials (by rarity)`), as two transparent videos plus a background video per rarity. The opening depends on the card's rarity:

| Rarity | Opening | Background |
| --- | --- | --- |
| Common | Middle tear top-down, 2 rips (`middle-tear-top-down-2-rips-slab4.mp4`) | `bg-common.mp4` |
| Uncommon | Middle tear top-down, 2 rips | `bg-uncommon.mp4` |
| Rare | Default 3D unpacking (`default-3d-unpacking-slab4.mp4`) | `bg-rare.mp4` |
| Epic (shown as "Legendary") | Default 3D unpacking | `bg-legendary.mp4` |

There are two packs, each with its own pair of openings: the **standard** pack (`…-standard.mp4`) and the **vintage** pack (`…-vintage.mp4`, its own page on the site). The demo's **Pack** menu switches between them; on a page, pick the pair in the frame's URL (`clip=default-3d-unpacking-vintage&low=middle-tear-top-down-2-rips-vintage`). The vintage pack also has its own backgrounds, `unveil/bg-vintage-<tier>.mp4`: the same backgrounds as pixel art, with retro pixel particles and effects in them (stars, streaks, shockwaves at the rips, shards, halos, confetti, fireworks, coins, more the rarer). They're pre-recorded (960 × 540), so nothing is drawn at runtime. They fade in and out as dissolving pixels recorded in the video, so the page shows them at full opacity rather than fading them again (`baked` in `demo.js`).

Both openings start the same way: the sealed pack is held for 0.5 s, trembling over a white light, so the rarity isn't given away until the opening itself starts.

Live: https://3jsspace.vercel.app (the pack page starts on the officials).

## Run the demo

Everything is plain ES modules, with no build and no dependencies. Serve the folder over http (`file://` won't run modules), for example:

```bash
npx serve .
```

Then open the printed address, pick a rarity and press **Open**.

## How it fits together

- **`unveil/video.html`** (with `video.js`) is the opening, meant to sit in an `<iframe>` over the stage with a transparent background. Its URL picks the two videos:
  `unveil/video.html?clip=default-3d-unpacking-slab4&low=middle-tear-top-down-2-rips-slab4&split=rare&intro=500&pace=0.85`
  - `clip` plays for `split` (rare) and up; `low` plays below it.
  - `intro` is the shared start, in ms.
  - `pace` is the speed both were made at.
  - `box=1,<top>,<height>` says where the sealed pack stands in the frame, as shares of its size (the demo uses `1,0.14,0.62`). Without it, the pack is laid out for the site's old modal and fills the frame.
- **The videos have no alpha channel of their own.** Each frame holds two pictures one over the other: the scene over black, and its coverage as white on black. `src/player/AlphaVideo.js` recombines them in WebGL, and a `light` uniform washes the pack towards a colour.
- **The page talks to the frame by `postMessage`**, same origin; the protocol is in `review/shared.js`.
  - page → frame:
    - `{ to: 'reveal', type: 'open', tier, speed }`, with `speed: 0.85`
    - `{ type: 'reset' }`
    - `{ type: 'light', colour: [r, g, b], amount }`
  - frame → page (`from: 'reveal'`):
    - `sealed` means ready.
    - `opening`.
    - `charging { ms }` says the shared start begins, and how long it lasts.
    - `rolling { at }` says the opening's own video is playing.
    - `beat { index, of, at }` comes at each rip.
    - `revealed` means show the card now.
    - `error { message }`.
- **The backgrounds** are opaque 1920 × 1080 videos that fill the stage behind the frame.
  - `slab/js/backdrops.js` has each one's timing in its own frames:
    - the first white flash (`charge`)
    - the burst (`impact`)
    - the last flash (`flash`)
    - the end (`end`)
    - its fade in and out (`fade`), played as the video's opacity
  - `demo.js` shows the syncing the site does:
    - The dark charge is stretched over `charging`.
    - First flash to last flash runs over the opening's video, from `rolling`.
    - It waits just short of the last flash until `revealed`, then plays to its end and has faded out.
    - Each frame, the pack is washed towards the background's average colour (`washOf`).
- **The card: slab display and details** (`card.js`, `card.css`, `card-details.css`). At `revealed`, the page shows the card the way the site does:
  - **The slab** (the graded card's photo) comes out of the pack's middle. It starts as a card of light on its back, turns round to its face, and grows from the pack's card size to full size in one curve (0.85 s at the reveal's pace). Meanwhile the opening's frame fades out, over a white flash tinted the rarity's colour.
  - **A starburst** sits behind it: long rays in the rarity's colour plus finer white ones, opening out and turning. From rare up, a halo of rays stays behind the slab, turning slowly. A shine sweeps across the slab once it lands.
  - **The details** appear under the stage about 0.6 s later: the card's name in Anton, its year, number and grade in Fragment Mono, the rarity and value tags, and the Share / Sell / Unpack again buttons. The buttons are slightly glassy, and Sell and Unpack again have a light sweep.
  - `card-details.css` is generated from the site's own stylesheet, so it always matches the site. It expects the site's font variables (`--font-display`, `--font-mono`, `--font-sans`; `index.html` sets fallbacks) and the Google Fonts link in `index.html`.
  - `showCard( stage, detailsElement, card, { onAgain, onSell } )` returns `{ remove() }`. A card is `{ name, imageUrl, tier, grader, grade, value }`; `cards.json` has a few real cards from the pack for each rarity. Sell pays 85 % of the value, and a pack costs $50, as on the site.
  - The site's floating motes and embers (a canvas particle system) and its sound aren't included.

## Files

| File | Size |
| --- | --- |
| `README.md` | 6 KB |
| `card-details.css` | 7 KB |
| `card.css` | 4 KB |
| `card.js` | 12 KB |
| `cards.json` | 6 KB |
| `demo.js` | 7 KB |
| `index.html` | 3 KB |
| `review/shared.js` | 7 KB |
| `slab/js/backdrops.js` | 4 KB |
| `src/player/AlphaVideo.js` | 8 KB |
| `unveil/bg-common.mp4` | 685 KB |
| `unveil/bg-legendary.mp4` | 1.17 MB |
| `unveil/bg-rare.mp4` | 912 KB |
| `unveil/bg-uncommon.mp4` | 899 KB |
| `unveil/bg-vintage-common.mp4` | 761 KB |
| `unveil/bg-vintage-legendary.mp4` | 1.57 MB |
| `unveil/bg-vintage-rare.mp4` | 1.22 MB |
| `unveil/bg-vintage-uncommon.mp4` | 1.19 MB |
| `unveil/clips.js` | 2 KB |
| `unveil/default-3d-unpacking-standard.mp4` | 2.88 MB |
| `unveil/default-3d-unpacking-vintage.mp4` | 2.95 MB |
| `unveil/middle-tear-top-down-2-rips-standard.mp4` | 2.28 MB |
| `unveil/middle-tear-top-down-2-rips-vintage.mp4` | 2.15 MB |
| `unveil/video.html` | 1 KB |
| `unveil/video.js` | 11 KB |

Made from the 3jsspace project (`node scripts/package-officials.mjs`). The openings are recordings of the Blender exports as they play in three.js. To change the pack, its art or its movement, the videos have to be recorded again there.
