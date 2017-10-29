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
	isNumeric( n ) {
		return !isNaN( parseFloat( n ) ) && isFinite( n );
	},
	/**
	 * Generates a random int between min and max, inclusive on both ends.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#Getting_a_random_integer_between_two_values_inclusive
	 */
	randomInt( min, max ) {
		min = Math.ceil( min );
		max = Math.floor( max );
		return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
	},
	/**
	 * Returns an object of arguments retrieved from `location.search` of a `window` object.
	 */
	locationArgs( win ) {
		let search;

		try {
			search = win.location.search;
		} catch( e ) {
			console.warn( 'Invalid window object, could not access `location.search`.' );
			return {};
		}

		const args = {};
		const params = search.replace( /^\?/, '' ).split( '&' );

		params.forEach( ( p, i ) => {
			let param = p.split( '=' );

			// single length param is either empty or true.
			if ( param.length < 2 )
				if ( param[ 0 ] ) args[ param[ 0 ] ] = true;

			// 2 arg param sets a key and value
			if ( param.length === 2 )
				args[ param[ 0 ] ] = param[ 1 ];
		} );

		return args;
	},
	/**
	 * Normalizes a radian angle to keep it between -2PI and 2PI
	 *
	 * @param number angle  The angle that may need normalization.
	 */
	normalizeAngle( angle ) {
		const limit = 2 * Math.PI;
		let normalized = angle;
		if ( angle >= limit )
			normalized -= limit * Math.floor( normalized / limit );
		else if ( angle <= -limit )
			normalized += limit * Math.floor( normalized / -limit );

		return normalized;
	},
	/**
	 * Attempts to safely retrieve a nested property from a `source` object.
	 * The `propString` determines the levels and names of properties, with the
	 * names/levels delineatd by a period.
	 * ex: The desired target object is `bar`, the parent/source object is foo
	 *     var foo = {
	 *         baz: {
	 *            gaz: {}
	 *                bar: 'bar'
	 *            }
	 *         }
	 *     }
	 *     property( foo, 'baz.gaz.bar' );
	 *     > 'bar'
	 *
	 * @return varies
	 */
	property( source, propString ) {
		const propTree = String( propString ).split( '.' );
		let current = source || undefined;
		let i = 0;

		while( Object.prototype.isPrototypeOf( current ) && i < propTree.length ) {
			current = current[ propTree[ i ] ];
			i++;
		}

		if ( current === source ) return;
		return current;
	}
};
