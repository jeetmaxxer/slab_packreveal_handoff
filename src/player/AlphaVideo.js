// A video with transparency, out of an ordinary one. A video file has no transparency that every
// browser plays, so each frame of ours holds two pictures: the scene over black, and what it covers,
// white on black. Side by side (the scene on the left), or one over the other (the scene on top):
// `stack: 'down'`, for a picture that side by side would be wider than every phone decodes. A small
// shader puts the two together again on a canvas, which then lies over the page as the scene itself would.
//
//   const film = new AlphaVideo( canvas );
//   await film.load( url );      // all of it in memory, its first frame on the canvas ( url, { stack, fade } )
//   film.play( time => … );      // called with the video's time as each frame is drawn
//   film.pause(); await film.rewind();
//
// The canvas takes one picture's size in pixels; give it any size on the page with CSS.

const VERTEX = `
attribute vec2 corner;
varying vec2 at;
void main() {

	at = vec2( corner.x * 0.5 + 0.5, 0.5 - corner.y * 0.5 );
	gl_Position = vec4( corner, 0.0, 1.0 );

}`;
// (What a video holds as black and white is not quite either: the ends of what it covers are taken
// as nothing and all. And where there is nothing at all, no light either: what is left there is the
// video's own noise. The colour is as it was over black, which is what a canvas wants: premultiplied.)
const FRAGMENT = `
precision mediump float;
uniform sampler2D frame;
uniform vec2 edge; // (half a pixel of one picture, the way the two lie: nothing of the other is taken in at the seam)
uniform vec2 part; // (one picture's share of the frame, each way)
uniform vec2 other; // (from the scene's picture to the other)
uniform vec2 fade; // (how far in from its edges the picture comes in, as shares of it: none, or softly)
uniform vec4 light; // (the light of what is round it: a colour, and how far the picture is washed towards it)
varying vec2 at;
void main() {

	vec2 scene = clamp( at, edge, 1.0 - edge ) * part;
	vec3 colour = texture2D( frame, scene ).rgb;
	float cover = smoothstep( 0.02, 0.98, texture2D( frame, scene + other ).g );
	colour = mix( colour, light.rgb * cover, light.a );
	float there = max( cover, max( colour.r, max( colour.g, colour.b ) ) );
	vec2 inside = smoothstep( vec2( 0.0 ), max( fade, vec2( 1e-6 ) ), min( at, 1.0 - at ) );
	gl_FragColor = vec4( colour * smoothstep( 0.012, 0.04, there ), cover ) * inside.x * inside.y;

}`;

export class AlphaVideo {

	/** @param {HTMLCanvasElement} canvas */
	constructor( canvas ) {

		this.canvas = canvas;
		this.video = Object.assign( document.createElement( 'video' ), { muted: true, playsInline: true, preload: 'auto', disableRemotePlayback: true } );
		this.video.setAttribute( 'playsinline', '' ); // (a phone would otherwise play it full screen)
		this.playing = false;
		this._onFrame = null;
		this._turn = 0;
		const gl = this.gl = canvas.getContext( 'webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false } );
		if ( ! gl ) throw new Error( 'This browser cannot draw the video (no WebGL).' );
		const program = gl.createProgram();
		for ( const [ type, source ] of [ [ gl.VERTEX_SHADER, VERTEX ], [ gl.FRAGMENT_SHADER, FRAGMENT ] ] ) {

			const shader = gl.createShader( type );
			gl.shaderSource( shader, source );
			gl.compileShader( shader );
			gl.attachShader( program, shader );

		}

		gl.linkProgram( program );
		if ( ! gl.getProgramParameter( program, gl.LINK_STATUS ) ) throw new Error( gl.getProgramInfoLog( program ) || 'The video could not be set up.' );
		gl.useProgram( program );
		gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [ - 1, - 1, 1, - 1, - 1, 1, 1, 1 ] ), gl.STATIC_DRAW );
		const corner = gl.getAttribLocation( program, 'corner' );
		gl.enableVertexAttribArray( corner );
		gl.vertexAttribPointer( corner, 2, gl.FLOAT, false, 0, 0 );
		gl.bindTexture( gl.TEXTURE_2D, gl.createTexture() );
		for ( const [ name, value ] of [ [ gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE ], [ gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE ], [ gl.TEXTURE_MIN_FILTER, gl.LINEAR ], [ gl.TEXTURE_MAG_FILTER, gl.LINEAR ] ] ) gl.texParameteri( gl.TEXTURE_2D, name, value );
		this._uniforms = Object.fromEntries( [ 'edge', 'part', 'other', 'fade', 'light' ].map( name => [ name, gl.getUniformLocation( program, name ) ] ) );

	}

	/**
	 * Loads the whole video (so it never waits for the network while it plays) and draws its first frame.
	 * @param {string} url
	 * @param {Object} [o]
	 * @param {'across'|'down'} [o.stack='across'] - how its two pictures lie: side by side, or one over the other
	 * @param {number} [o.fade=0] - the picture comes in softly from its edges, over this share of its
	 *   shorter side: for one whose scene runs out of it, where a hard edge would show
	 */
	async load( url, { stack = 'across', fade = 0 } = {} ) {

		const response = await fetch( url );
		if ( ! response.ok ) throw new Error( `The video could not be loaded (${ response.status }).` );
		const video = this.video;
		video.src = URL.createObjectURL( await response.blob() );
		await new Promise( ( done, failed ) => {

			video.addEventListener( 'loadeddata', done, { once: true } );
			video.addEventListener( 'error', () => failed( new Error( 'This browser cannot play the video.' ) ), { once: true } );
			video.load();

		} );
		// (one picture is half the video, wide or high)
		const down = stack === 'down', gl = this.gl;
		this.canvas.width = video.videoWidth / ( down ? 1 : 2 );
		this.canvas.height = video.videoHeight / ( down ? 2 : 1 );
		const soft = fade * Math.min( this.canvas.width, this.canvas.height ); // (px of the picture)
		gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
		gl.uniform2f( this._uniforms.edge, down ? 0 : 1 / video.videoWidth, down ? 1 / video.videoHeight : 0 );
		gl.uniform2f( this._uniforms.part, down ? 1 : 0.5, down ? 0.5 : 1 );
		gl.uniform2f( this._uniforms.other, down ? 0 : 0.5, down ? 0.5 : 0 );
		gl.uniform2f( this._uniforms.fade, soft / this.canvas.width, soft / this.canvas.height );
		this.draw();

	}

	/** Draws the frame the video is on. */
	draw() {

		const gl = this.gl;
		if ( this.video.readyState < 2 ) return;
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video );
		gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

	}

	/**
	 * Plays from where it is, drawing each frame as the video has it.
	 * @param {(time: number) => void} [onFrame] - called after each frame is drawn, with the video's time (s)
	 * @returns {Promise<void>} settles once it is playing
	 */
	play( onFrame = null ) {

		const video = this.video, mine = ++ this._turn;
		this._onFrame = onFrame;
		this.playing = true;
		const frame = time => {

			this.draw();
			this._onFrame?.( time );

		};

		if ( video.requestVideoFrameCallback ) {

			const step = ( now, data ) => {

				if ( mine !== this._turn || ! this.playing ) return;
				frame( data.mediaTime );
				video.requestVideoFrameCallback( step );

			};

			video.requestVideoFrameCallback( step );

		} else {

			const step = () => {

				if ( mine !== this._turn || ! this.playing ) return;
				frame( video.currentTime );
				requestAnimationFrame( step );

			};

			requestAnimationFrame( step );

		}

		return video.play();

	}

	pause() {

		this.playing = false;
		this._turn ++;
		this.video.pause();

	}

	/** Back to the first frame (or to `time`, s), drawn. */
	async rewind( time = 0 ) {

		const video = this.video;
		this.pause();
		if ( video.currentTime !== time || video.ended ) {

			await new Promise( done => {

				video.addEventListener( 'seeked', done, { once: true } );
				setTimeout( done, 600 ); // (a browser that does not say)
				video.currentTime = time;

			} );

		}

		this.draw();

	}

	/** The light of what is round it, [ r, g, b ] (0 … 1), and how far (0 … 1) the picture is washed towards it. */
	setLight( colour, amount ) {

		this.gl.uniform4f( this._uniforms.light, colour[ 0 ], colour[ 1 ], colour[ 2 ], amount );
		if ( ! this.playing ) this.draw();

	}

	set speed( value ) {

		this.video.playbackRate = Math.min( 8, Math.max( 0.1, value || 1 ) );

	}

	get speed() {

		return this.video.playbackRate;

	}

	get time() {

		return this.video.currentTime;

	}

}
