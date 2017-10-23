'use strict';
const Matter = require( 'matter-js' );
const Util = require( './util.js' );
const Vector = Matter.Vector;

const Components = {
	position( x, y ) {
		return {
			type: 'position',
			position: Vector.create( ~~x, ~~y )
		};
	},
	rotation( angle ) {

	}
}
