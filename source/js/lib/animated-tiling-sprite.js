'use strict'

// @TODO Make this better if it will actually be used.
//       Use TilingSprite and AnimatedSprite
// module.exports = function() {
// 	return {
// 		fromImage() {
			
// 		}
// 	}
// }
// temporary until this can be better configured.

const PIXI = require( 'pixi.js' );

module.exports = function( textures, width, height ) {
	let o = 0;
	let t = 10;
	let i = 0;
	let l = textures.length;
	let tiled = PIXI.extras.TilingSprite.from(
		textures[ 0 ],
		width,
		height
	);
	tiled.x = width / 2;
	tiled.y = height / 2;
	tiled.anchor.set( 0.5 );

	tiled.update = function( delta ) {
		if ( o === t - 1 ) {
			this._texture = textures[ i ];
			i = ( i + 1 ) % l;
		}
		o = ( o + 1 ) % t;
	}

	return tiled;
}
