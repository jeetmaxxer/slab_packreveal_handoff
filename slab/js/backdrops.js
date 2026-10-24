// The backgrounds a reveal marked `hype` (the officials) opens a card over, one for each tier, in place of
// its other effects: the user's StylizedVFX videos ("reveal VFX rarities/<tier>.mov", QuickTime Animation
// with transparency, 30 a second, made into unveil/bg-<tier>.mp4: 1280 x 720, their colour; their own fade
// in and out, the same over all of each, as `fade`: its opacity at each of its frames (of 255), the ones
// between them whole), filling the stage behind the pack. Each is timed to the opening (slab/js/pull.js,
// `legend`): its dark charge (to `charge`, s: its first white flash) over the opening's shared start, that
// flash as the pack starts to tear, its impact and burst while it tears, and its last white flash (`flash`,
// s) as the card comes; then its lit stage behind the card, which fades out (at its `end` it is gone: the
// stage is the site's again). With `loop` (s) it does not: from there its rays sway on in a loop
// (unveil/bg-<tier>-loop.mp4: its lit stage, frames 78 to 101, 79 to 101, 70 to 88 and 82 to 102, its last 8 frames
// faded into its first, so that it runs on forwards and round again without a seam, not on and back as it did). `reveal`: s from the start of
// the opening's own video to the card, at the speed it is staged at: the officials' common and uncommon
// cards open as the middle tear (1.8667 s, from 0.25 s in), rare and epic as the default (2.0901 s:
// unveil/clips.js). A tier without one (null) keeps the page's own effects for it instead.
// (Shared with scripts/record-officials.js, which records the officials with them for /compare/.)
// (the times are the videos' own: frames 18 / 68 / 111, 18 / 69 / 111, 15 / 61 / 97, 18 / 72 / 111; and `impact`,
// the frame of the burst between the two flashes: 47, 49, 45, 55, where the officials' sound has its boom)
// (`loop`: the frame a loop would take over at; none now: each clip plays on to its own end and fades out, as asked on 2026-10-21, "let the background clip end")
const BACKDROP = ( tier, charge, impact, flash, end, reveal, fade, loop = null ) => ( {
	tier, url: new URL( `../../unveil/bg-${ tier }.mp4`, import.meta.url ).href, loopUrl: new URL( `../../unveil/bg-${ tier }-loop.mp4`, import.meta.url ).href,
	charge: charge / 30, impact: impact / 30, flash: flash / 30, loop: loop && loop / 30, end: end / 30, reveal, fade,
} );
const LOW = 1.8667 - 0.25, HIGH = 2.0901;
export const BACKDROPS = [ // (by rank: common, uncommon, rare, epic)
	BACKDROP( 'common', 18, 47, 68, 111, LOW, { in: [ 0, 0, 67, 124, 171, 207, 234, 249 ], out: [ 253, 247, 236, 221, 202, 179, 152, 120, 84, 44, 0 ], from: 101 } ),
	BACKDROP( 'uncommon', 18, 49, 69, 111, LOW, { in: [ 0, 0, 67, 124, 171, 207, 234, 249 ], out: [ 253, 247, 236, 221, 202, 179, 152, 120, 84, 44, 0 ], from: 101 } ),
	BACKDROP( 'rare', 15, 45, 61, 97, HIGH, { in: [ 0, 0, 76, 139, 188, 224, 246 ], out: [ 252, 245, 232, 214, 191, 163, 130, 92, 48, 0 ], from: 88 } ),
	BACKDROP( 'legendary', 18, 55, 72, 111, HIGH, { in: [ 0, 0, 67, 124, 171, 207, 234, 249 ], out: [ 252, 245, 232, 214, 191, 163, 130, 92, 48, 0 ], from: 102 } ),
];

// (a background's opacity at a time, s: its own fade in and out; and over its dark charge it rises out
// of the stage, slowly and then faster, to all of it at its first white flash, so that the stage is not
// cut to the charge's near black before the opening, as asked on 2026-10-21)
export const legendShown = ( bg, time ) => {

	const frame = Math.max( 0, Math.floor( time * 30 ) ), { fade } = bg;
	const own = ( frame < fade.in.length ? fade.in[ frame ] : frame < fade.from ? 255 : fade.out[ frame - fade.from ] ?? 0 ) / 255;
	return own * Math.min( 1, Math.max( 0, time / bg.charge ) ) ** 2;

};

// How far the pack is washed towards a background's light (slab/js/pull.js, `relight`): `light`, how
// bright the background is (0 … 1, eased), and `shown`, how much of it is there.
export const washOf = ( light, shown ) => 0.85 * Math.min( 1, Math.max( 0, ( light - 0.2 ) / 0.7 ) ) ** 1.3 * shown;
