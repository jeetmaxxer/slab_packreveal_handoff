// What the review page and the reveal pages share: the demo prizes, and the few messages that pass
// between the review page's pack modal and a reveal page running in its box (?embed=1).
//
// Embedded, a reveal page has no controls of its own. The modal's buttons drive it:
//   modal → page   { type: 'open', tier, speed } · { type: 'reset' } · { type: 'speed', speed }
//                  (any of them may carry `palette`, { tier: colour }: the holder's own tier colours)
//                  Where the holder has a pack of its own and says where it stands (`from` in ?box=),
//                  'open' may carry `arrive` (ms: the page's pack comes from there to its place over
//                  this time, then opens), `wait` (ms before it opens) and `at` (when the holder
//                  started, ms since the epoch); 'reset' may carry `leave` (ms: back there) and `at`.
//                  { type: 'rest' } · { type: 'wake' }: kept loaded but out of sight (nothing need be drawn), and back
//   page → modal   { type: 'sealed' } (ready, the pack is waiting) · { type: 'opening' } ·
//                  { type: 'settling', ms } (where the pack and the slab have places of their own: what
//                  is on show starts from the one for the other, and takes this long) ·
//                  { type: 'revealed', prize, stats } · { type: 'error', message }
//                  { type: 'beat', index, of, at } (an opening that gives its prize away, ?tease=1: each
//                  rip of it as it starts, for the holder to join in; `at`: where the rip is in the
//                  frame, [ x, y ] as shares of it, or null where that is not known) ·
//                  { type: 'flash' } (such an opening that shows its prize itself: the moment of its flash)

export const TIERS = {
	common: { label: 'Common', color: '#c9d1d9' },
	uncommon: { label: 'Uncommon', color: '#4ade80' },
	rare: { label: 'Rare', color: '#60a5fa' },
	epic: { label: 'Epic', color: '#c084fc' },
	legendary: { label: 'Legendary', color: '#fbbf24' },
};

// the pack on sale (on the site: from the product)
export const PACK = { brand: 'Pokemon', name: 'Ascended Heroes', kind: 'Booster box', price: 50 };

// demo prizes (on the site the server sends the card)
export const CARDS = [
	{ name: 'Rayquaza VMAX', year: 2021, set: '2021 Pokemon Evolving Skies', number: '218', psa: 10, grade: 'GEM MT 10', line: 'Alternate Art · PSA 10', image: 'https://images.pokemontcg.io/swsh7/218_hires.png' },
	{ name: 'Umbreon VMAX', year: 2021, set: '2021 Pokemon Evolving Skies', number: '215', psa: 10, grade: 'GEM MT 10', line: 'Alternate Art · PSA 10', image: 'https://images.pokemontcg.io/swsh7/215_hires.png' },
	{ name: 'Charizard ex', year: 2023, set: '2023 Pokemon SV151', number: '199', psa: 9, grade: 'MINT 9', line: 'Special Illustration Rare · PSA 9', image: 'https://images.pokemontcg.io/sv3pt5/199_hires.png' },
];
export const VALUES = { common: 12, uncommon: 65, rare: 340, epic: 5000, legendary: 28500 };

// a card's scan for use in a texture or canvas. (Its own address: the image host answers a plain
// <img> request without the header that lets a page read the pixels, and that answer gets reused.)
export const scan = card => `${ card.image }?slab`;

/** A demo card's certificate number, as its slab's label has it. */
export const certOf = card => String( 10000000 + Number( card.number ) * 104729 % 89999999 );

/**
 * What the modal shows for a prize: as on the design, "2013 #120 Garchomp PSA 10", stars for the
 * grade; and what the site's own sheet shows of a card (who graded it, its certificate, its set).
 */
export function describePrize( card, tier ) {

	return { title: `${ card.year } #${ card.number } ${ card.name } PSA ${ card.psa }`, tier, value: VALUES[ tier ], stars: Math.floor( card.psa / 2 ),
		grader: 'PSA', certId: certOf( card ), grade: card.grade, set: card.set, image: card.image };

}

// --- a reveal page inside the modal's box ----------------------------------------------------------
const query = new URLSearchParams( location.search );
export const embedded = query.get( 'embed' ) === '1';
// On the site's own stage (?stage=1) rather than in the modal's box: the frame covers the whole panel,
// the pack and the slab are seen whole (nothing to step back to on a click), and the sealed pack
// waits as one still picture until it is opened.
export const inStage = embedded && query.get( 'stage' ) === '1';
/** Close on the pack, as the modal's design has it (the pack and the slab run out of the box). */
export const closeUp = embedded && ! inStage;
/**
 * On the site's stage the holder may show the prize itself, as a picture of the card (?prize=image):
 * the page's part then ends with the flash that would have shown its slab ('revealed', with no prize).
 */
export const flatPrize = inStage && query.get( 'prize' ) === 'image';
/**
 * On the site's stage an opening may give away how rare its prize is as it plays (?tease=1): its
 * stars and the light from the tear take the tier's colour, the more of them the rarer it is.
 */
export const teasing = inStage && query.get( 'tease' ) === '1';
/** A cap on the pixels a player renders (?px=), for a frame much larger than the modal's box. */
export const maxPixels = Number( query.get( 'px' ) ) || undefined;
// Where the design puts things in the box, as shares of its width and height: the sealed pack and the
// revealed slab are larger than the box and run out of it at the bottom. `whole`: where the slab goes
// when it is clicked, to be looked at all at once (clicked again, it comes close again).
export const BOX = { pack: { width: 0.797, top: 0.138 }, slab: { width: 0.754, top: 0.144 }, whole: { width: 0.54, top: 0.045 } };
// A holder with a box of another shape says where they go: ?box=<pack>;<slab>;<whole>;<from>, each
// "width,top" or "width,top,height": as large as fits that wide and that high, its top `top` down.
// `from` (if given): where the holder's own pack stands, which the page's sealed pack is laid over.
( query.get( 'box' ) ?? '' ).split( ';' ).forEach( ( part, i ) => {

	const [ width, top, height ] = part.split( ',' ).map( Number ), key = [ 'pack', 'slab', 'whole', 'from' ][ i ];
	if ( key && width > 0 && top >= 0 ) BOX[ key ] = { width, top, ...( height > 0 ? { height } : {} ) };

} );

/**
 * The page's end of the conversation with the modal.
 * @param {{ open?: Function, reset?: Function, speed?: Function }} handlers - called with the message
 * @return {(type: string, data?: object) => void} sends a message to the modal
 */
export function connectModal( handlers ) {

	addEventListener( 'message', e => {

		if ( e.source !== parent || e.origin !== location.origin || e.data?.to !== 'reveal' ) return;
		for ( const [ tier, color ] of Object.entries( e.data.palette ?? {} ) ) if ( TIERS[ tier ] && /^#[0-9a-f]{6}$/i.test( color ) ) TIERS[ tier ].color = color;
		handlers[ e.data.type ]?.( e.data );

	} );
	return ( type, data = {} ) => parent.postMessage( { from: 'reveal', type, ...data }, location.origin );

}

/** How smoothly a reveal played: feed it every frame's time while it runs, read `result()` at the end. */
export function frameMeter() {

	let last = 0, frames = 0, total = 0, worst = 0, long = 0;
	return {
		tick( now ) {

			if ( last ) {

				const dt = now - last;
				frames ++;
				total += dt;
				worst = Math.max( worst, dt );
				if ( dt > 25 ) long ++;

			}

			last = now;

		},
		result: () => frames < 5 ? null : { fps: 1000 * frames / total, worst, long },
	};

}
