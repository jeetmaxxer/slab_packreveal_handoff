// An opening as a video, for a frame: ?clip=<one of unveil/clips.js>. What a Blender export does in
// three.js (unveil/unveil.js), played from one small file instead: nothing to set up, nothing to
// compile. It is driven the same way (review/shared.js): "open" plays it, "reset" goes back to the
// sealed pack, and it tells where it is ("sealed", "opening", each rip as a "beat", "revealed").
// The holder shows the prize, and how rare it is: the video is the same for every card.
//
// A pair (the officials): ?clip=<for the rarer cards>&low=<for the others>&split=<the first rarity
// the first is for>. Both are loaded; "open" says the card's rarity, which picks the one that plays.
// ?intro=<ms>: both start the same way, whichever plays: its sealed pack held for so long, trembling
// more and more over a light behind it that gives nothing away, then its own opening. A clip may
// start a little way in (`start` in clips.js: where its pack is still sealed, but about to go).
// ?pace=<share>: the speed the holder's asking already holds (the reveal's `pace`): a clip made at its
// own speed, with none of its own, plays in its own time at it.
import { BOX, connectModal, frameMeter } from '../review/shared.js';
import { AlphaVideo } from '../src/player/AlphaVideo.js';
import { CLIPS } from './clips.js';

const $ = id => document.getElementById( id );
const params = new URLSearchParams( location.search );
const TIERS = [ 'common', 'uncommon', 'rare', 'epic' ];
const PAGE_PACE = Number( params.get( 'pace' ) ) || 1, INTRO = Math.max( 0, Number( params.get( 'intro' ) ) || 0 );
const SPLIT = Math.max( 0, TIERS.indexOf( params.get( 'split' ) ?? 'rare' ) );
const takes = [ params.get( 'clip' ), params.get( 'low' ) ].filter( Boolean ).map( ( name, i ) => ( { clip: CLIPS[ name ], name, canvas: i ? $( 'canvas' ).cloneNode() : $( 'canvas' ), film: null, going: null } ) );
// (a video made at the speed its opening is staged at plays in its own time when it is asked for that speed)
const rate = ( take, speed ) => speed / ( take.clip.pace ?? PAGE_PACE );
let take = takes[ 0 ], state = 'loading', turn = 0, beat = 0, meter = null, metering = 0, asked = 1;
let where = 0; // (whether the pack is at its place (1) or at the holder's own pack (0), or bound for it)

const tell = connectModal( {
	open: order => open( order ),
	reset: order => reset( order ),
	speed: order => ( asked = order.speed ) && take.film && ( take.film.speed = rate( take, asked ) ),
	// (the light of what the holder has round the pack: the picture washed towards it, so far)
	light: order => takes.forEach( one => one.film?.setLight( order.colour ?? [ 1, 1, 1 ], Math.min( 1, Math.max( 0, order.amount ?? 0 ) ) ) ),
	// (asked to rest, or to wake: a video costs nothing while it waits)
	rest: () => {},
	wake: () => {},
} );
const fail = message => {

	$( 'message' ).textContent = message;
	tell( 'error', { message } );

};

for ( const type of [ 'error', 'unhandledrejection' ] ) addEventListener( type, e => fail( `The reveal could not start: ${ e.reason?.message ?? e.message ?? 'unknown error' }` ) );

// --- where the picture is in the frame -------------------------------------------------------------
// The holder says where the sealed pack stands (?box=, as shares of the frame: so wide, its top so far
// down; with a height, as large as fits both). The picture is laid so that the pack in it stands there.
function placed( { clip }, box ) {

	const shape = clip.pack.width * clip.size[ 0 ] / ( clip.pack.height * clip.size[ 1 ] ); // (the pack's width to its height)
	const pack = Math.min( box.width * innerWidth, box.height ? box.height * innerHeight * shape : Infinity ), wide = pack / clip.pack.width, high = wide * clip.size[ 1 ] / clip.size[ 0 ];
	return { left: innerWidth / 2 - ( clip.pack.left + clip.pack.width / 2 ) * wide, top: box.top * innerHeight - clip.pack.top * high, width: wide, height: high };

}

// (where the holder has a pack of its own, ours comes from there: the picture as it lies with its pack over that one)
function fromHome( one ) {

	if ( ! BOX.from ) return 'none';
	const here = placed( one, BOX.pack ), home = placed( one, BOX.from );
	return `translate(${ ( home.left - here.left ).toFixed( 2 ) }px, ${ ( home.top - here.top ).toFixed( 2 ) }px) scale(${ ( home.width / here.width ).toFixed( 5 ) })`;

}

// The pack's way to its place (1) or back to the holder's pack (0), over `ms` from the moment `at`
// (ms since the epoch): by the curve the holder moves its own pack by, so the one stays laid over the other.
function travel( to, ms = 0, at ) {

	where = to;
	for ( const one of takes ) {

		one.going?.cancel();
		const home = fromHome( one ), away = [ { transform: home }, { transform: 'none' } ];
		one.going = one.canvas.animate( to ? away : away.reverse(), { duration: Math.max( 0, ms ), easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' } );
		if ( ms > 0 && at !== undefined ) one.going.startTime = at - performance.timeOrigin;

	}

}

function layout() {

	for ( const one of takes ) {

		const { left, top, width, height } = placed( one, BOX.pack );
		Object.assign( one.canvas.style, { left: `${ left.toFixed( 2 ) }px`, top: `${ top.toFixed( 2 ) }px`, width: `${ width.toFixed( 2 ) }px`, height: `${ height.toFixed( 2 ) }px` } );

	}

	// (the light of the shared start: behind the pack's middle)
	const pack = placed( take, BOX.pack ), middle = take.clip.pack;
	Object.assign( $( 'charge' ).style, { left: `${ ( pack.left + ( middle.left + middle.width / 2 ) * pack.width ).toFixed( 1 ) }px`, top: `${ ( pack.top + ( middle.top + middle.height / 2 ) * pack.height ).toFixed( 1 ) }px`, width: `${ ( middle.width * pack.width * 2.4 ).toFixed( 1 ) }px` } );
	travel( where );

}

// (the one that plays, and only it seen)
function choose( one ) {

	take = one;
	for ( const other of takes ) other.canvas.style.visibility = other === one ? '' : 'hidden';
	layout();

}

// a place in the picture (shares of it), as shares of the frame
function inFrame( place ) {

	if ( ! place ) return null;
	const box = take.canvas.getBoundingClientRect();
	return [ ( box.left + place[ 0 ] * box.width ) / innerWidth, ( box.top + place[ 1 ] * box.height ) / innerHeight ];

}

// --- the opening --------------------------------------------------------------------------------------
// (called as each frame is drawn, and by the video's own clock: the holder hears of each rip as its
// stars come out, and of the moment the card is its to show)
function watch( time ) {

	const { clip, film } = take;
	if ( state !== 'opening' || ! film.playing ) return;
	for ( ; beat < clip.beats.length && time >= clip.beats[ beat ] - clip.lead; beat ++ ) tell( 'beat', { index: beat, of: clip.beats.length, at: inFrame( clip.places[ beat ] ) } );
	if ( time >= clip.reveal ) {

		state = 'revealed';
		cancelAnimationFrame( metering );
		tell( 'revealed', { stats: meter?.result() } );

	}

}

// The shared start: the sealed pack trembles, more and more, over a light that swells behind it.
// (Laid on the pack's own way to its place, not in place of it.)
let trembling = [];
function tremble( ms ) {

	// (by the pack's size: to this share of its width at the most, and so many degrees)
	const shakes = 14, reach = 0.018 * placed( take, BOX.pack ).width * take.clip.pack.width, tilt = 1.2;
	const keys = Array.from( { length: shakes + 1 }, ( _, i ) => {

		const k = ( i / shakes ) ** 1.6 * ( i < shakes ? 1 : 0 ), side = i % 2 ? 1 : - 1;
		return { translate: `${ ( side * reach * k ).toFixed( 2 ) }px ${ ( ( i % 3 - 1 ) * 0.5 * reach * k ).toFixed( 2 ) }px`, rotate: `${ ( - side * tilt * k ).toFixed( 2 ) }deg` };

	} );
	take.canvas.style.transformOrigin = `${ ( ( take.clip.pack.left + take.clip.pack.width / 2 ) * 100 ).toFixed( 1 ) }% ${ ( ( take.clip.pack.top + take.clip.pack.height / 2 ) * 100 ).toFixed( 1 ) }%`;
	trembling = [
		take.canvas.animate( keys, { duration: ms, easing: 'linear' } ),
		$( 'charge' ).animate( [ { opacity: 0, scale: 0.6 }, { opacity: 0.55, scale: 1, offset: 0.85 }, { opacity: 0, scale: 1.15 } ], { duration: ms + 450, easing: 'ease-out' } ),
	];

}

async function open( order = {} ) {

	if ( ! take.film || state === 'loading' || state === 'opening' ) return;
	const again = state === 'revealed';
	if ( again ) await take.film.rewind( take.clip.start );
	// (the card's rarity picks the one that plays)
	choose( takes.length > 1 && TIERS.indexOf( order.tier ) < SPLIT ? takes[ 1 ] : takes[ 0 ] );
	const { film, clip } = take;
	if ( order.speed ) asked = order.speed;
	film.speed = rate( take, asked );
	const mine = ++ turn;
	state = 'opening';
	tell( 'opening' );
	// Where the holder has a pack of its own, ours comes from there to its place over the time the
	// holder says, in step with it. The pack opens as it arrives, or after the wait the holder asks for.
	const started = () => performance.timeOrigin + performance.now(), at = order.at ?? started(), arrive = Math.max( 0, order.arrive ?? 0 );
	travel( 1, arrive, at );
	if ( film.time !== ( clip.start ?? 0 ) ) await film.rewind( clip.start );
	const wait = Math.max( arrive, order.wait ?? 0 ) - ( started() - at );
	if ( wait > 0 ) await new Promise( done => setTimeout( done, wait ) );
	if ( mine !== turn || state !== 'opening' ) return;
	// (at the speed asked for: a fast opening's start is as much the quicker)
	const hold = INTRO / ( asked / PAGE_PACE );
	tell( 'charging', { ms: hold } ); // (the holder hears when the opening itself starts, and how long its shared start is)
	if ( hold > 0 ) {

		tremble( hold );
		await new Promise( done => setTimeout( done, hold ) );
		take.canvas.style.transformOrigin = ''; // (its way back to the holder's pack is laid out from its corner)
		if ( mine !== turn || state !== 'opening' ) return;

	}

	beat = 0;
	meter = frameMeter();
	// (how smoothly the page ran while it played: by the page's own frames)
	const tick = now => {

		if ( mine !== turn || state !== 'opening' ) return;
		meter.tick( now );
		metering = requestAnimationFrame( tick );

	};

	metering = requestAnimationFrame( tick );
	// (the opening's own video is playing, from where it stood: the holder may keep in step with it)
	film.play( watch ).then( () => mine === turn && tell( 'rolling', { at: film.time - ( clip.start ?? 0 ) } ), e => mine === turn && fail( `The reveal could not play: ${ e.message }` ) );

}

// (`order`: the holder's, which may say how long its own pack takes back to its place)
function reset( order = {} ) {

	if ( ! take.film || state === 'loading' ) return;
	turn ++;
	cancelAnimationFrame( metering );
	trembling.forEach( one => one.cancel() );
	travel( 0, Math.max( 0, order.leave ?? 0 ), order.at );
	take.film.rewind( take.clip.start );
	state = 'sealed';
	tell( 'sealed' );

}

if ( ! takes.length || takes.some( one => ! one.clip ) ) fail( 'No such video (?clip=).' );
else {

	for ( const one of takes.slice( 1 ) ) {

		one.canvas.removeAttribute( 'id' );
		$( 'canvas' ).after( one.canvas );

	}
	await Promise.all( takes.map( async one => {

		one.film = new AlphaVideo( one.canvas );
		await one.film.load( one.clip.url, { stack: one.clip.stack, fade: one.clip.fade } );
		if ( one.clip.start ) await one.film.rewind( one.clip.start );
		// (the video's own clock, should its frames not be drawn: in a page out of sight)
		one.film.video.addEventListener( 'timeupdate', () => one === take && watch( one.film.time ) );
		one.film.video.addEventListener( 'ended', () => one === take && watch( Infinity ) );

	} ) );
	window.film = take.film; // for experiments in the console
	addEventListener( 'resize', layout );
	choose( takes[ 0 ] );
	for ( const one of takes ) one.canvas.classList.add( 'ready' );
	state = 'sealed';
	tell( 'sealed' );

}
