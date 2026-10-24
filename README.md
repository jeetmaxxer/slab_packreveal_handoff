# SLAB officials reveal

The pack opening the SLAB site plays for the **officials** (`Officials (by rarity)`), as two transparent videos plus a background video per rarity. The opening depends on the card's rarity:

| Rarity | Opening | Background |
| --- | --- | --- |
| Common | Middle tear top-down, 2 rips (`middle-tear-top-down-2-rips-slab4.mp4`) | `bg-common.mp4` |
| Uncommon | Middle tear top-down, 2 rips | `bg-uncommon.mp4` |
| Rare | Default 3D unpacking (`default-3d-unpacking-slab4.mp4`) | `bg-rare.mp4` |
| Epic (shown as "Legendary") | Default 3D unpacking | `bg-legendary.mp4` |

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
- The site shows the card itself, as a picture, at `revealed`, along with its details and buttons. In the demo that is a line of text.

## Files

| File | Size |
| --- | --- |
| `README.md` | 4 KB |
| `demo.js` | 6 KB |
| `index.html` | 2 KB |
| `review/shared.js` | 7 KB |
| `slab/js/backdrops.js` | 4 KB |
| `src/player/AlphaVideo.js` | 8 KB |
| `unveil/bg-common.mp4` | 685 KB |
| `unveil/bg-legendary.mp4` | 1.17 MB |
| `unveil/bg-rare.mp4` | 912 KB |
| `unveil/bg-uncommon.mp4` | 899 KB |
| `unveil/clips.js` | 1 KB |
| `unveil/default-3d-unpacking-slab4.mp4` | 2.88 MB |
| `unveil/middle-tear-top-down-2-rips-slab4.mp4` | 2.12 MB |
| `unveil/video.html` | 1 KB |
| `unveil/video.js` | 11 KB |

Made from the 3jsspace project (`node scripts/package-officials.mjs`). The openings are recordings of the Blender exports as they play in three.js. To change the pack, its art or its movement, the videos have to be recorded again there.
