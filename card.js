// The card, as the site shows it when the opening says "revealed" (slab/js/pull.js, `present` and
// `renderResult`, for the officials): the graded slab comes out of the pack where it stands, a card of
// light turning round to its face, small to its size, over a flash; a starburst of rays behind it, and
// from rare up a halo of rays that stays, turning slowly; a shine across it once it is there. Then under
// it its details: its name large, its year, number and grade, its rarity and value as two plates, and
// three buttons (card-details.css, the site's own styles for them).
//
//   const shown = showCard( stage, card, { onAgain, onSell } );   …   shown.remove();
//
// `card`: { name, imageUrl, tier, grader, grade, value } (cards.json: the pack's own cards, as its catalog
// has them). `stage`: the element the opening plays in; the pack's middle is at `PACK_MIDDLE` of its height.

const PACK_MIDDLE = 0.45, PACK_HEIGHT = 0.62; // (where the demo has its pack: index.html's `box`)
const SLAB_HEIGHT = 0.68, SLAB_SHAPE = 688 / 1136; // (the slab, as high as this share of the stage; a slab photo's width to its height)
const PACE = 0.85; // (the reveal's speed: the card's way takes its time at it, as the opening does)
// the card's way out of the pack, ms of the opening from its flash (EMERGE in slab/js/pull.js)
const EMERGE = { flash: [ 100, 600 ], shown: [ 100, 135 ], from: 85, card: 850, small: 0.67, ease: 'cubic-bezier(.23,.6,.36,1)', frame: [ 600, 884 ], details: 520 };
// the starburst, for the officials: twice as large, two and a half times as slow, a quarter brighter (STARBURST)
const STARBURST = { size: 2, slow: 2.5, bright: 1.25 };
const TIERS = [ 'common', 'uncommon', 'rare', 'epic' ];
const RARITY = { common: '#7f7f7f', uncommon: '#43db9c', rare: '#5c85ff', epic: '#ffc300' }; // (the site's --rarity-*)
const NAMES = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Legendary' }; // (the design's names: the site's top tier is its Legendary)
const GRADERS = { PSA: 'PSA', CGC: 'CGC', Beckett: 'BGS', BGS: 'BGS', SGC: 'SGC' };
const BUYBACK = 0.85, PRICE = 50; // (what a card sells back for, as a share of its value; what a pack costs)

const esc = text => String( text ).replace( /[&<>"']/g, c => `&#${ c.charCodeAt( 0 ) };` );
const money = value => `$${ Number.isInteger( value ) ? value : value.toFixed( 2 ) }`;

// Rays for a starburst, as a conic gradient: `count` round the circle, each somewhere in its own share of it,
// up to `widest` degrees wide and of its own strength (a fixed seed: the same burst every time). Colour: --ray.
function rays( count, seed, widest ) {

	let state = seed;
	const next = () => ( state = state * 16807 % 2147483647 ) / 2147483647, share = 360 / count, stops = [ 'transparent 0deg' ];
	for ( let i = 0; i < count; i ++ ) {

		const middle = ( i + 0.2 + 0.6 * next() ) * share, half = Math.min( 0.2 * share, ( 0.25 + 0.75 * next() ) * widest / 2 );
		stops.push( `transparent ${ ( middle - half ).toFixed( 2 ) }deg`, `color-mix( in srgb, var( --ray ) ${ Math.round( 35 + 65 * next() ) }%, transparent ) ${ middle.toFixed( 2 ) }deg`, `transparent ${ ( middle + half ).toFixed( 2 ) }deg` );

	}

	return `conic-gradient( ${ stops.join( ', ' ) }, transparent 360deg )`;

}

// A card's name as the officials show it (the pack's names are its listing's, cut at 32 letters: "2023 #348
// Gardevoir EX PSA 10 Sca"): what it is, large ("Gardevoir EX"), and under it its year, number and grade.
export function cardLabel( card ) {

	const [ , year = '', number = '', rest = card.name ] = /^(\d{4})\s+(#\S+)\s+(.*)$/.exec( card.name ?? '' ) ?? [];
	let title = rest.replace( /^Full Art\//i, '' );
	const cut = title.search( /\s(PSA|CGC|BGS|SGC|Beckett)\b/ );
	if ( cut > 0 ) title = title.slice( 0, cut );
	else if ( ( card.name ?? '' ).length >= 32 ) title = title.replace( /\s+\S*$/, '' ); // (cut off in the middle of a word)
	const grade = /(\d+(?:\.\d+)?)/.exec( card.grade ?? '' )?.[ 1 ] ?? '';
	title = title.trim().replace( /\s*[&/+-]$/, '' );
	return { title: title || card.name, line: [ year, number, GRADERS[ card.grader ] ?? card.grader ?? '', grade ].filter( Boolean ).join( ' ' ) };

}

/**
 * Shows `card` coming out of the pack on `stage`, and its details under the stage in `details`.
 * @param {HTMLElement} stage - where the opening plays (its `iframe` is faded out as the card comes)
 * @param {HTMLElement} details - where the card's details go
 * @param {object} card
 * @param {{ onAgain?: Function, onSell?: Function }} [actions]
 * @return {{ remove(): void }}
 */
export function showCard( stage, details, card, { onAgain, onSell } = {} ) {

	const rank = Math.max( 0, TIERS.indexOf( card.tier ) ), tc = RARITY[ card.tier ] ?? RARITY.common;
	const height = stage.clientHeight, slabH = SLAB_HEIGHT * height, still = matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	const r = ms => still ? 0 : ms / PACE, q = ms => still ? 0 : ms; // (the card's way at the reveal's pace; what is round it at the page's)
	const lag = r( EMERGE.from ), going = [];
	const animate = ( element, keys, options ) => going.push( element.animate( keys, options ) );

	// --- the slab ---
	const display = document.createElement( 'div' );
	display.className = 'slab-display';
	display.setAttribute( 'aria-hidden', 'true' );
	display.style.cssText = `--tc: ${ tc }; --hint: ${ rank ? tc : '#eef1f8' }; --slab-h: ${ slabH.toFixed( 1 ) }px; --slab-w: ${ ( slabH * SLAB_SHAPE ).toFixed( 1 ) }px; --slab-mid: ${ ( PACK_MIDDLE * height ).toFixed( 1 ) }px`;
	display.innerHTML = `<i class="sd-whiteout"></i>
		<div class="sd-burst"><i class="long"></i><i class="short"></i><i class="halo"></i></div>
		<span class="sd-flash"></span>
		<div class="sd-slot"><div class="sd-envelope"></div><div class="sd-card3d"><div class="sd-face sd-back"></div><div class="sd-face sd-front"><div class="sd-photo"><img alt="" draggable="false" src="${ esc( card.imageUrl ) }"><i class="sd-glare"></i></div></div></div></div>`;
	stage.append( display );
	const $ = selector => display.querySelector( selector );
	const [ long, short, halo ] = $( '.sd-burst' ).children;
	[ [ long, 22, 7, 5.5 ], [ short, 34, 3, 3 ], [ halo, 10, 5, 24 ] ].forEach( ( [ ray, count, seed, widest ] ) => ray.style.backgroundImage = rays( count, seed, widest ) );

	// what is left of the pack (the opening's frame) fades as the card comes out of it
	const frame = stage.querySelector( 'iframe' );
	if ( frame ) animate( frame, [ { opacity: 1 }, { opacity: 1, offset: EMERGE.frame[ 0 ] / EMERGE.frame[ 1 ] }, { opacity: 0 } ], { duration: r( EMERGE.frame[ 1 ] ), fill: 'forwards' } );

	if ( ! still ) {

		// the flash the card comes in: white, out to its tier's colour, brighter the rarer
		animate( $( '.sd-whiteout' ), [ { opacity: 0, easing: 'cubic-bezier(.4,0,.7,.6)' }, { opacity: 0.74 + 0.085 * rank, offset: EMERGE.flash[ 0 ] / EMERGE.flash[ 1 ], easing: 'cubic-bezier(.25,.5,.4,1)' }, { opacity: 0 } ], { duration: r( EMERGE.flash[ 1 ] ) } );
		// from the pack's middle, small (as high as the pack's own card), to its size, and from its back to its face, by one curve
		const way = { duration: r( EMERGE.card ), delay: lag, easing: EMERGE.ease, fill: 'backwards' };
		const faces = shown => [ { opacity: shown }, { opacity: shown, offset: 0.5 }, { opacity: 1 - shown, offset: 0.5 }, { opacity: 1 - shown } ];
		animate( $( '.sd-slot' ), [ { scale: Math.min( 1, EMERGE.small * PACK_HEIGHT / SLAB_HEIGHT ).toFixed( 3 ) }, { scale: 1 } ], way );
		animate( $( '.sd-slot' ), [ { opacity: 0 }, { opacity: 1 } ], { duration: r( EMERGE.shown[ 1 ] - EMERGE.shown[ 0 ] ), delay: r( EMERGE.shown[ 0 ] ), fill: 'backwards' } );
		animate( $( '.sd-card3d' ), [ { transform: 'rotateY(-180deg)' }, { transform: 'rotateY(0deg)' } ], way );
		animate( $( '.sd-back' ), faces( 1 ), way );
		animate( $( '.sd-front' ), faces( 0 ), way );
		// (a card of light as it comes, as the pack's own was: that dies away as its face comes round)
		animate( $( '.sd-envelope' ), [ { transform: 'rotateY(-180deg)', opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.88 }, { transform: 'rotateY(0deg)', opacity: 0 } ], way );
		// the starburst behind it: uneven rays in its tier's colour and finer white ones, opening out and turning a little
		const big = STARBURST, peak = Math.min( 1, ( 0.5 + 0.15 * rank ) * big.bright ), grow = ( 0.82 + 0.06 * rank ) * big.size, out = { easing: 'cubic-bezier(.16,.8,.3,1)' };
		animate( long, [ { opacity: 0, transform: `scale(${ 0.2 * grow }) rotate(-14deg)` }, { opacity: peak, transform: `scale(${ 0.92 * grow }) rotate(0deg)`, offset: 0.28 }, { opacity: peak * 0.55, transform: `scale(${ grow }) rotate(7deg)`, offset: 0.62 }, { opacity: 0, transform: `scale(${ 1.06 * grow }) rotate(13deg)` } ], { duration: q( 1500 * big.slow ), delay: q( 90 ) + lag, ...out } );
		animate( short, [ { opacity: 0, transform: `scale(${ 0.25 * grow }) rotate(10deg)` }, { opacity: Math.min( 1, peak + 0.15 ), transform: `scale(${ grow }) rotate(0deg)`, offset: 0.3 }, { opacity: 0, transform: `scale(${ 1.1 * grow }) rotate(-9deg)` } ], { duration: q( 1050 * big.slow ), delay: q( 60 ) + lag, ...out } );
		// (from rare up, a halo of rays that stays behind it, turning slowly)
		if ( rank >= 2 ) {

			halo.style.scale = String( big.size );
			animate( halo, [ { opacity: 0 }, { opacity: Math.min( 1, ( 0.16 + 0.1 * rank ) * big.bright ) } ], { duration: q( 900 * big.slow ), delay: q( 520 ) + lag, fill: 'both' } );
			animate( halo, { rotate: [ '0deg', '360deg' ] }, { duration: 48000 * big.slow, iterations: Infinity } );

		}

		animate( $( '.sd-flash' ), [ { opacity: 0, transform: 'scale(.5)' }, { opacity: 0.55, transform: 'scale(.9)', offset: 0.25 }, { opacity: 0, transform: 'scale(1.3)' } ], { duration: q( 650 ), delay: lag, easing: 'ease-out' } );
		// a shine across it once it is there
		const glare = $( '.sd-glare' ), once = { duration: q( 1000 ), delay: lag + q( 650 ), easing: 'cubic-bezier(.35,.1,.35,1)' };
		animate( glare, [ { opacity: 0, visibility: 'visible' }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.72 }, { opacity: 0, visibility: 'visible' } ], once );
		for ( const [ pseudoElement, far ] of [ [ '::before', 28 ], [ '::after', 36.8 ] ] ) animate( glare, [ { transform: `translateX(-${ far }%)` }, { transform: `translateX(${ far }%)` } ], { ...once, pseudoElement } );

	}

	// --- its details, as the card has come ---
	const { title, line } = cardLabel( card ), sell = Math.round( card.value * BUYBACK * 100 ) / 100;
	const result = document.createElement( 'div' );
	result.className = 'stage-officials';
	result.innerHTML = `<div class="oc-head"><h3 class="oc-name">${ esc( title ) }</h3><p class="oc-line">${ esc( line ) }</p></div>
		<div class="oc-facts"><span class="oc-tag oc-tier" data-rarity="${ esc( card.tier ) }"><i aria-hidden="true"></i>${ NAMES[ card.tier ] ?? esc( card.tier ) }</span><span class="oc-tag oc-price"><span class="sr-only">Insured value </span>${ money( card.value ) }</span></div>
		<div class="oc-actions"><button type="button" class="oc-button oc-quiet" data-share>Share</button><div class="contents" data-sale><button type="button" class="oc-button" data-sell>Sell ${ money( sell ) }</button></div><div class="contents" data-again><button type="button" class="oc-button" data-unpack-again>Unpack again ${ money( PRICE ) }</button></div></div>`;
	result.querySelector( '[data-sell]' ).addEventListener( 'click', e => {

		e.currentTarget.disabled = true;
		e.currentTarget.textContent = `Sold ${ money( sell ) }`;
		onSell?.( card, sell );

	} );
	result.querySelector( '[data-unpack-again]' ).addEventListener( 'click', () => onAgain?.() );
	result.querySelector( '[data-share]' ).addEventListener( 'click', () => navigator.share?.( { text: `I pulled ${ card.name } on Slab Cash.` } ).catch( () => {} ) );
	const landing = setTimeout( () => {

		details.append( result );
		display.dataset.step = 'landed';

	}, r( EMERGE.details ) );

	return {
		remove() {

			clearTimeout( landing );
			going.forEach( one => one.cancel() );
			display.remove();
			result.remove();

		},
	};

}
