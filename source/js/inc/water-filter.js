'use strict'

const PIXI = require( 'pixi.js' );

const ShaderSource = {
	vertex() {
		return [
			'//precision highp float;',
			'attribute vec2 aVertexPosition;',
			'attribute vec2 aTextureCoord;',
			'uniform mat3   projectionMatrix;',
			// 'uniform mat3   filterMatrix;',
			'varying vec2   vTextureCoord;',
			// 'varying vec2   vFilterCoord;',

			'void main(void){',
			'	gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
			// '	vFilterCoord = ( filterMatrix * vec3( aTextureCoord, 1.0) ).xy;',
			'	vTextureCoord = aTextureCoord;',
			'}'
		].join( '\n' )
	},
	fragment() {
		return [
			'varying vec2 vTextureCoord;',
			'uniform sampler2D uSampler;',
			'uniform vec4 filterArea;',
			'float blurRed( vec2 pos ) {',
			'	float color = 0.0;',
			'	for (int i = -9; i <= 9; i++) {',
			'		for (int j = -9; j <= 9; j++) {',
			'			color += texture2D( uSampler, pos + vec2( i, j ) / filterArea.xy ).r;',
			'		}',
			'	}',
			'	return color / 361.0;',
			'}',
			'void main( void ) {',
			'	gl_FragColor = texture2D( uSampler, vTextureCoord );',
			// '	gl_FragColor.r = blurRed( vTextureCoord );',
			'}'
		].join( '\n' );
	}
}

module.exports = function() {
	let proto = Object.create( PIXI.Filter.prototype );

	let filter = Object.assign( proto,
		{ /* assign other custom stuff here*/ }
	);

	PIXI.Filter.call( filter, ShaderSource.vertex(), ShaderSource.fragment() );

	return filter;
}
