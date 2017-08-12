'use strict'

module.exports = {
	/**
	 * Enum-like immutable object with 3 states.
	 */
	TrinaryState: Object.freeze( { 
		POSITIVE: 1,
		NEUTRAL: 0,
		NEGATIVE: -1
	} ),
	toDegrees( angle ) {
		return angle * ( 180 / Math.PI );
	},
	toRadians( angle ) {
		return angle * ( Math.PI / 180 );
	},
	/**
	 * Checks is a value is numeric
	 * https://stackoverflow.com/questions/9716468/is-there-any-function-like-isnumeric-in-javascript-to-validate-numbers#answer-16655847
	 */
	isNumeric( val ) {
		return Number( parseFloat( val ) ) == val;
	}
};
