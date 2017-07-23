'use strict';
const Vec = require( 'victor' );

function Shape( options ) {
	return Object.create( {
		position: Vec.prototype.isPrototypeOf( options.position ) ? options.position : Array.isArray( options.position ) ? Vec.fromArray( options.position ) : Vec( 0, 0 ),
		color: options.color || 0x000000,
		mass: isNaN( options.mass ) ? 0 : options.mass,
		velocity: Vec( 0, 0 ),
		forces: options.forces || [],
		preUpdates: Array.isArray( options.preUpdates ) ? options.preUpdates : [],
		postUpdates: Array.isArray( options.postUpdates ) ? options.postUpdates : [],
		preUpdate( delta ) {
			for ( let i = 0, l = this.preUpdates.length; i < l; i++ )
				this.preUpdates[ i ].call( this, delta );
		},
		postUpdate( delta ) {
			for ( let i = 0, l = this.postUpdates.length; i < l; i++ )
				this.postUpdates[ i ].call( this, delta );
		},
		/**
		 * Updates the properties of the Circle from options. @TODO dynamically go through options.
		 */
		update( options, delta ) {
			this.preUpdate( delta );
			this.color = options.color || this.color;
			this.position = Vec.prototype.isPrototypeOf( options.position ) ? options.position : Array.isArray( options.position ) ? Vec.fromArray( options.position ) : this.position,
			this.radius = isNaN( options.radius ) ? this.radius : options.radius;
			this.mass = isNaN( options.mass ) ? this.mass : options.mass;
			this.velocity = options.velocity || this.velocity;
			this.postUpdate( delta );
		}
	} );
};

module.exports = {
	Circle( options ) {
		const base = Shape( options );

		return Object.assign( base, {
			radius: isNaN( options.radius ) ? 50 : options.radius,
			drawMethod: 'drawCircle',
			static: false,
			drawArgs() {
				return [
					this.position.x,
					this.position.y,
					this.radius
				];
			},
			updateBase: base.update,
			/**
			 * Updates the properties of the Circle from options. @TODO dynamically go through options.
			 */
			update( options, delta ) {
				this.preUpdate( delta );
				this.updateBase( options, delta );
				this.postUpdate( delta );
			}
		}, base );
	},
	Rectangle( options ) {
		const base = Shape( options );

		return Object.assign( base, {
			dimensions: 0
		} );
	}
};
