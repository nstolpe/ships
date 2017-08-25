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
	 * https://stackoverflow.com/questions/9716468/is-there-any-function-like-isnumeric-in-javascript-to-validate-numbers#answer-9716488
	 */
	isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},
	/**
	 * Generates a random int between min and max, inclusive on both ends.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#Getting_a_random_integer_between_two_values_inclusive
	 */
	randomInt( min, max ) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor( Math.random() * (max - min + 1) ) + min;
	}
};
