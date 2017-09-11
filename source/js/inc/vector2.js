'use strict';
const Util = require( './util.js' );

function Coords( x, y ) {
	// no arguments returns zeroed.
	if ( x == null && y == null ) {
		return { x: 0, y: 0 };
	// cascading approach if their are args. `x` Array or object takes presedence over `y`,
	// objects take presedence over arrays. ex: {x: 1 }, [ undefined, 2 ] returns { x: 1, y: 2 }
	} else {
		let i = 0;
		// set the intermediary x and y. null or undefined gets NaN
		let xx = x != null ? Object.assign( x ) : NaN;
		let yy = y != null ? Object.assign( y ) : NaN;

		const solvers = {
			// when iterated, solvers.x tries for x.x, x[0], then x
			x: [
				( x ) => Number( x.x ),
				( x ) => Number( x[0] ),
				( x ) => Number( x ),
			],
			// when iterated, solvers.y tries for x.y, x[1], y.y, y[1], y, and x
			y: [
				( y ) => Number( x != null ? x.y : undefined ),
				( y ) => Number( x != null ? x[1] : undefined ),
				( y ) => Number( y != null ? y.y : undefined ),
				( y ) => Number( y != null ? y[1] : undefined ),
				( y ) => Number( y != null ? y : undefined ),
				( y ) => Number( x != null && !Array.isArray( x ) ? x : undefined ),
			]
		};

		// run solvers on `x` until `xx` is a number of solvers run out
		while ( !Util.isNumeric( xx ) && i < solvers.x.length ) {
			xx = solvers.x[ i ]( x );
			i++;
		}

		// reset `i`
		i = 0;

		// run solvers on `y` until `yy` is a number of solvers run out
		while ( !Util.isNumeric( yy ) && i < solvers.y.length ) {
			yy = solvers.y[ i ]( y );
			i++;
		}

		return { x: xx.valueOf(), y: yy.valueOf() };
	}
}

const proto = {
	valid() {
		return Util.isNumeric( this.x ) && Util.isNumeric( this.y );
	},
	/**
	 * Copies this vector onto another vector, `target`.
	 * `target` is returned but can also be passed as an argument. 
	 */
	copy( target ) {
		target = target || Vector2();
		target.set( this );
		return target;
	},
	/**
	 * Sets the values of this vector to `x` and `y`, `x.x` and `x.y`, or `x[0]` and `x[1]`,
	 * depending on what `x` is.
	 * Returns this vector.
	 */
	set( x, y ) {
		const other = Coords( x, y );
		this.x = other.x;
		this.y = other.y;
		return this;
	},
	/**
	 * Adds the incoming object, array or values to this `vector`.
	 */
	add( x, y ) {
		const other = Coords( x, y );
		this.x += other.x;
		this.y += other.y;
		return this;
	},
	/**
	 * Subtracts the incoming object, array or values to this `vector`.
	 */
	sub( x, y ) {
		const other = Coords( x, y );
		this.x -= other.x;
		this.y -= other.y;
		return this;
	},
	/**
	 * Multiplies the incoming object, array or values to this `vector`.
	 */
	mul( x, y ) {
		const other = Coords( x, y );
		this.x *= other.x;
		this.y *= other.y;
		return this;
	},
	/**
	 * Alternate way to think-about/call multiply
	 */
	scale( x, y ) {
		return this.mul( x, y );
	},
	dot( x, y ) {
		const other = Coords( x, y );
		return this.x * other.x + this.y * other.y;
	},
	cross( x, y ) {
		const other = Coords( x, y );
		return this.x * other.y - this.y * other.x;
	},
	/**
	 * Returns the length of this `vector`
	 */
	len() {
		return Math.sqrt( this.x * this.x + this.y * this.y );
	},
	len2() {
		return this.dot( this );
	},
	/**
	 * Normalizes this `vector`
	 */
	nor() {
		const len = this.len();
		if ( len != 0 ) {
			this.x /= len;
			this.y /= len;
		}
		return this;
	},
	reverse() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	},
	/**
	 * Returns the angle between this `vector` and the x axis.
	 * If `radians` is true, the angle will be returned as radians between -Math.PI and Math.PI.
	 * If not, the angle will be returned in degrees, between 0 and 360.
	 */
	angle( radians ) {
		let angle;

		if ( radians ) {
			angle = Math.atan2( this.y, this.x );
		} else {
			angle = Util.toDegrees( Math.atan2( this.y, this.x ) );
			angle += angle < 0 ? 360 : 0;
		}

		return angle;
	},
	/**
	 * Rotates the vector by `angle`
	 * `angle` is expected to be in radians. 
	 */
	rotate( angle ) {
		let cos = Math.cos( angle );
		let sin = Math.sin( angle );
		let x = this.x * cos - this.y * sin;
		let y = this.x * sin + this.y * cos;

		this.x = x;
		this.y = y;

		return this;
	},
	/**
	 * Rotates the vector by `angle`
	 * `angle` is expected to be in degrees. 
	 */
	rotateDeg( angle ) {
		return rotate( Util.toRadians( angle ) );
	},
	/**
	 * Returns the distance between this and another vector
	 */
	dist( x, y ) {
		const coords = Coords( x, y );
		const dx = this.x - x;
		const dy = this.y - y;

		return Math.sqrt( dx * dx + dy * dy );
	},
	/**
	 * Projects this vector on another vector
	 */
	project( x, y ) {
		const target = Coords( x, y );
		const amt = this.dot( target ) / target.len2();
		this.x = amt * target.x;
		this.y = amt * target.y;
		return this;
	},
	/**
	 * Reflects this vector on to an axis.
	 */
	reflect( axis ) {
		const x = this.x;
		const y = this.y;
		this.project( axis ).scale( 2 );
		this.x -= x;
		this.y -= y;
		return this;
	},
	/**
	 * Converts this vector to it's perpendicular vector
	 */
	perp() {
		let x = this.x;
		this.x = this.y;
		this.y = -x;
		return this;
	},
	/**
	 * @TODO use object create and getters/setters for the next few
	 */
	min() {
		return this.x;
	},
	max() {
		return this.y;
	},
	a() {
		return this.x;
	},
	b() {
		return this.y;
	},
	toString() {
		return `[ x: ${ this.x}, y: ${ this.y } ]`;
	}
};

const Vector2 = function( x, y ) {
	const coords = Coords( x, y );
	return Object.assign( Object.create( proto ), coords );
	// return Object.assign( Object.create( Object.prototype ), coords, proto );
}

module.exports = Vector2;
