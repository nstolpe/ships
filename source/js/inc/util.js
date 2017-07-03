'use strict'

module.exports = {
	toDegrees( angle ) {
		return angle * ( 180 / Math.PI );
	},
	toRadians( angle ) {
		return angle * ( Math.PI / 180 );
	},
	TernaryState: Object.freeze( { 
		MINUS: -1,
		EQUAL: 0,
		PLUS: 1
	} )
}
