'use strict';
const Vec = require( 'victor' );

module.exports = {
	Circle( props ) {
		return {
			color: props.color || 0x000000,
			position: Vec.prototype.isPrototypeOf( props.position ) ? props.position : Array.isArray( props.position ) ? Vec.fromArray( props.position ) : Vec( 0, 0 ),
			radius: isNaN( props.radius ) ? 50 : props.radius,
			mass: isNaN( props.mass ) ? 0 : props.mass,
			velocity: Vec( 0, 0 ),
			preUpdates: Array.isArray( props.preUpdates ) ? props.preUpdates : [],
			postUpdates: Array.isArray( props.postUpdates ) ? props.postUpdates : [],
			forces: props.forces || [],
			drawMethod: 'drawCircle',
			drawArgs() {
				return [
					this.position.x,
					this.position.y,
					this.radius
				];
			},
			/**
			 * Updates the properties of the Circle from props. @TODO dynamically go through props.
			 */
			update( props, delta ) {
				this.preUpdate( delta );
				this.color = props.color || this.color;
				this.position = Vec.prototype.isPrototypeOf( props.position ) ? props.position : Array.isArray( props.position ) ? Vec.fromArray( props.position ) : this.position,
				this.radius = isNaN( props.radius ) ? this.radius : props.radius;
				this.mass = isNaN( props.mass ) ? this.mass : props.mass;
				this.velocity = props.velocity || this.velocity;
				this.postUpdate( delta );
			},
			preUpdate( delta ) {
				for ( let i = 0, l = this.preUpdates.length; i < l; i++ )
					this.preUpdates[ i ].call( this, delta );
			},
			postUpdate( delta ) {
				for ( let i = 0, l = this.postUpdates.length; i < l; i++ )
					this.postUpdates[ i ].call( this, delta );
			}
		}
	}
}
