// The officials' openings as videos, two for each pack (the standard: standard; the vintage: vintage) (unveil/video.js plays them). Each frame is two pictures, the
// scene over black and what it covers as white on black, one over the other (`stack: 'down'`): see
// src/player/AlphaVideo.js. `size`: one picture, px. `pack`: where the sealed pack is in it, as shares of
// it. `start`: s in where it starts (still sealed, about to tear). `beats`: its rips, s, `lead`: s before
// each its stars come out, `places`: where each is in the picture. `reveal`: s to the card. `pace`: the
// speed it was made at. `fade`: the share of the picture it fades in over at its edges.
export const CLIPS = {
	'default-3d-unpacking-standard': { url: new URL( './default-3d-unpacking-standard.mp4', import.meta.url ).href, "size":[1682,1080],"stack":"down","pace":0.85,"fade":0.06,"pack":{"left":0.3716,"top":0.1556,"width":0.2574,"height":0.6898},"beats":[0.493,1.0218,2.0552],"lead":0.22,"places":[[0.5008,0.5919],[0.5028,0.6417],[0.5032,0.5277]],"reveal":2.0901 },
	'middle-tear-top-down-2-rips-standard': { url: new URL( './middle-tear-top-down-2-rips-standard.mp4', import.meta.url ).href, "size":[1080,1440],"stack":"down","fade":0.06,"pack":{"left":0.288,"top":0.2222,"width":0.425,"height":0.5563},"start":0.25,"beats":[0.6533,1.87],"lead":0.22,"places":[[0.5073,0.4694],[0.5059,0.6387]],"reveal":1.8667 },
	'default-3d-unpacking-vintage': { url: new URL( './default-3d-unpacking-vintage.mp4', import.meta.url ).href, "size":[1682,1080],"stack":"down","pace":0.85,"fade":0.06,"pack":{"left":0.3722,"top":0.1556,"width":0.2556,"height":0.6898},"beats":[0.493,1.0218,2.0552],"lead":0.22,"places":[[0.5008,0.5919],[0.5028,0.6417],[0.5032,0.5277]],"reveal":2.0901 },
	'middle-tear-top-down-2-rips-vintage': { url: new URL( './middle-tear-top-down-2-rips-vintage.mp4', import.meta.url ).href, "size":[1080,1440],"stack":"down","fade":0.06,"pack":{"left":0.2889,"top":0.2222,"width":0.4222,"height":0.5563},"start":0.25,"beats":[0.6533,1.87],"lead":0.22,"places":[[0.5073,0.4694],[0.5059,0.6387]],"reveal":1.8667 },
};
