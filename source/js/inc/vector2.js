'use strict';
const Util = require( './util.js' );

function Coords( x, y ) {
	// no arguments returns zeroed.
	if ( x === undefined && y === undefined ) {
		return { x: 0, y: 0 };
	// cascading approach if their are args. `x` Array or object takes presedence over `y`,
	// objects take presedence over arrays. ex: {x: 1 }, [ undefined, 2 ] returns { x: 1, y: 2 }
	} else {
		return {
			x: Number( x != null ? x.x : undefined ) ||
			   Number( x != null ? x[0] : undefined ) || 
			   Number( x != null ? x : undefined ),

			y: Number( x != null ? x.y : undefined ) ||
			   Number( x != null ? x[1] : undefined ) ||
			   Number( y != null ? y.y : undefined ) ||
			   Number( y != null ? y[1] : undefined ) ||
			   Number( y != null ? y : undefined ) ||
			   Number( x != null && !Array.isArray( x ) ? x : undefined )
		};
	}
}

const Vector2 = function( x, y ) {
	const coords = Coords( x, y );

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
			const coords = Coords( x, y );
			this.x = coords.x;
			this.y = coords.y;
			return this;
		},
		/**
		 * Adds the incoming object, array or values to this `vector`.
		 */
		add( x, y ) {
			const coords = Coords( x, y );
			this.x += coords.x;
			this.y += coords.y;
			return this;
		},
		/**
		 * Subtracts the incoming object, array or values to this `vector`.
		 */
		sub( x, y ) {
			const coords = Coords( x, y );
			this.x -= coords.x;
			this.y -= coords.y;
			return this;
		},
		/**
		 * Multiplies the incoming object, array or values to this `vector`.
		 */
		mul( x, y ) {
			const coords = Coords( x, y );
			this.x *= coords.x;
			this.y *= coords.y;
			return this;
		},
		/**
		 * Alternate way to think-about/call multiply
		 */
		scale( x, y ) {
			return this.mul( x, y );
		},
		dot( other ) {
			return this.x * other.x + this.y * other.y;
		},
		/**
		 * Returns the length of this `vector`
		 */
		len() {
			return Math.sqrt( this.x * this.x + this.y + this.y );
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
		angle() {
			const angle = Util.toDegrees( Math.atan2( y, x ) );
			return angle < 0 ? angle + 360 : angle;
		},
		/**
		 * Rotates the vector by `angle`
		 */
		rotate( angle ) {
			let rad = Util.toRadians( angle );
			let cos = Math.cos( rad );
			let sin = Math.sin( rad );
			let x = this.x * cos - this.y * sin;
			let y = this.x * sin + this.y * cos;

			this.x = x;
			this.y = y;

			return this;
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
		project( target ) {
			const amt = this.dot( target ) / target.len2();
			this.x = amt * target.x;
			this.y = amt * target.y;
			return this;
		},
		reflect( axis ) {
			const x = this.x;
			const y = this.y;
			this.project( axis ).scale( 2 );
			this.x -= x;
			this.y -= y;
			return this;
		}
	};

	return Object.assign( Object.create( Object.prototype ), coords, proto );
}

module.exports = Vector2;
