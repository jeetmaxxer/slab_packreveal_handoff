// The holder of the officials reveal, as the site's pack page is (slab/js/pull.js), and only that: it
// opens the frame (unveil/video.html) for a card of a rarity, plays that rarity's background behind it in
// step with the opening, and washes the pack towards the background's light. The site shows the card
// itself when the frame says "revealed"; here that is only a line of text.
import { BACKDROPS, legendShown, washOf } from './slab/js/backdrops.js';

const $ = id => document.getElementById( id );
const TIERS = [ 'common', 'uncommon', 'rare', 'epic' ];
const SPEED = 0.85; // (the reveal's own pace: both openings were made at it, so they play in their own time)
const frame = $( 'reveal' ), stage = frame.parentElement;
const send = ( type, data = {} ) => frame.contentWindow.postMessage( { to: 'reveal', type, ...data }, location.origin );

// every tier's background, loaded at the start so that none waits
const backdrops = BACKDROPS.map( bg => {

	const video = Object.assign( document.createElement( 'video' ), { src: bg.url, muted: true, playsInline: true, preload: 'auto', className: 'bg' } );
	stage.prepend( video );
	return { bg, video };

} );

let state = 'loading', tier = 'epic', run = 0, rolled = 0, carded = 0, lit = [ 0, 0, 0, 0 ], sample = null;
const buttons = () => {

	$( 'open' ).disabled = state !== 'sealed' && state !== 'revealed';
	$( 'reset' ).disabled = state === 'loading';

};

// --- the background, in step with the opening ----------------------------------------------------------
// Its dark charge over the shared start (`charging` says how long that is), from its first white flash to
// its last over the opening's own video (from `rolling`), waiting just short of its last flash for the
// card ("revealed"), and from there on at its own speed to its end, where it has faded out.
function playBackdrop( ms ) {

	const mine = ++ run, { bg, video } = backdrops[ TIERS.indexOf( tier ) ];
	const on = Math.max( 100, ms ), start = performance.now(), toCard = bg.reveal * 1000, wait = bg.flash - 0.04;
	const rates = [ bg.charge / ( on / 1000 ), ( bg.flash - bg.charge ) / bg.reveal ];
	rolled = carded = 0;
	lit = [ 0, 0, 0, 0 ];
	video.currentTime = 0;
	video.playbackRate = rates[ 0 ];
	video.style.opacity = legendShown( bg, 0 ).toFixed( 3 );
	video.classList.add( 'on' );
	video.play().catch( () => {} );
	// (where it should be by the clock, s: should it start late or fall behind, it is put there)
	const due = now => carded ? bg.flash + ( now - carded ) / 1000 : ! rolled ? bg.charge * Math.min( 1, ( now - start ) / on ) : Math.min( wait, bg.charge + ( bg.flash - bg.charge ) * ( now - rolled ) / toCard );
	const step = () => {

		if ( mine !== run ) return;
		const time = video.currentTime;
		if ( time >= bg.end - 0.01 ) return void stopBackdrops();
		video.style.opacity = legendShown( bg, time ).toFixed( 3 );
		if ( ! carded && time >= wait ) video.pause();
		else if ( video.paused ) video.play().catch( () => {} );
		if ( Math.abs( time - due( performance.now() ) ) > 0.12 && ! video.seeking ) video.currentTime = due( performance.now() );
		video.playbackRate = time < bg.charge ? rates[ 0 ] : time < bg.flash ? rates[ 1 ] : 1;
		relight( bg, video );
		requestAnimationFrame( step );

	};

	requestAnimationFrame( step );

}

function stopBackdrops() {

	run ++;
	for ( const { video } of backdrops ) {

		video.classList.remove( 'on' );
		video.style.opacity = '';
		video.pause();

	}

	send( 'light', { amount: 0 } );

}

// (the pack washed towards the background's colour, as much as it is bright and there: its white flashes nearly white)
function relight( bg, video ) {

	sample ??= Object.assign( document.createElement( 'canvas' ), { width: 16, height: 9 } ).getContext( '2d', { willReadFrequently: true } );
	if ( video.readyState < 2 ) return;
	sample.drawImage( video, 0, 0, 16, 9 );
	const px = sample.getImageData( 0, 0, 16, 9 ).data, sum = [ 0, 0, 0 ];
	for ( let i = 0; i < px.length; i += 4 ) for ( let c = 0; c < 3; c ++ ) sum[ c ] += px[ i + c ];
	const [ r, g, b ] = sum.map( v => v / ( px.length / 4 ) / 255 );
	lit = [ r, g, b, 0.2126 * r + 0.7152 * g + 0.0722 * b ].map( ( v, i ) => lit[ i ] + ( v - lit[ i ] ) * 0.4 );
	send( 'light', { colour: lit.slice( 0, 3 ), amount: washOf( lit[ 3 ], legendShown( bg, video.currentTime ) ) } );

}

// --- what the frame says ---------------------------------------------------------------------------------
addEventListener( 'message', e => {

	if ( e.source !== frame.contentWindow || e.origin !== location.origin || e.data?.from !== 'reveal' ) return;
	const { type } = e.data;
	if ( type === 'sealed' ) state = 'sealed';
	else if ( type === 'opening' ) state = 'opening';
	else if ( type === 'charging' ) playBackdrop( e.data.ms );
	else if ( type === 'rolling' ) rolled = performance.now() - ( e.data.at ?? 0 ) * 1000;
	else if ( type === 'revealed' ) {

		state = 'revealed';
		carded = performance.now();
		const { bg, video } = backdrops[ TIERS.indexOf( tier ) ];
		if ( video.currentTime < bg.flash - 0.1 ) video.currentTime = bg.flash;
		$( 'card' ).textContent = `${ tier === 'epic' ? 'Legendary' : tier[ 0 ].toUpperCase() + tier.slice( 1 ) } card`;
		$( 'card' ).classList.add( 'on' );

	} else if ( type === 'error' ) console.warn( 'reveal:', e.data.message );
	buttons();

} );

$( 'open' ).addEventListener( 'click', () => {

	tier = $( 'tier' ).value;
	$( 'card' ).classList.remove( 'on' );
	stopBackdrops();
	send( 'open', { tier, speed: SPEED } ); // (the rarity picks the opening: common and uncommon the middle tear, rare and epic the default)
	state = 'opening';
	buttons();

} );

$( 'reset' ).addEventListener( 'click', () => {

	$( 'card' ).classList.remove( 'on' );
	stopBackdrops();
	send( 'reset' );

} );
