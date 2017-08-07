'use strict';

const PIXI = require( 'pixi.js' );

module.exports = function ( ...points ) {
	const proto = {
		foo() {
			console.log( 'bar' );
		},
		bar() {
			console.log( 'foo' );
		}
	};

	const poly = Object.assign( Object.create( PIXI.Polygon.prototype ), proto );
	PIXI.Polygon.apply( poly, points );

	return poly;
}
