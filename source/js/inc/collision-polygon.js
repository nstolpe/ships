'use strict';

const PIXI = require( 'pixi.js' );

module.exports = function () {
	const proto = {
		foo() {
			console.log( 'bar' );
		},
		bar() {
			console.log( 'foo' );
		}
	};

	return Object.assign( Object.create( PIXI.Polygon.prototype ), proto );
}
