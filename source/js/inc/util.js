'use strict'

module.exports = {
	toDegrees( angle ) {
		return angle * ( 180 / Math.PI );
	},
	toRadians( angle ) {
		return angle * ( Math.PI / 180 );
	},
	/**
	 * Enum-like immutable object with 3 states.
	 */
	TrinaryState: Object.freeze( { 
		POSITIVE: 1,
		NEUTRAL: 0,
		NEGATIVE: -1
	} )
}
