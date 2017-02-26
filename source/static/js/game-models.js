'use strict'
const PIXI = require( 'pixi.js' );
const Sprite = PIXI.Sprite;
const Container = PIXI.Container;

module.exports = {
	/**
	 * Factory for TransformableRenderables. See documentation for Renderable and Transformable
	 *
	 * @param Object options  See Renderable and Transformable
	 */
	TransformableRenderable( options ) {
		if ( !options || !options.element ) throw new Error( 'No Sprite provided to renderable' );
		const transformable = this.Transformable( options );
		const renderable = this.Renderable( options );
		let o = {
			updateTransform: transformable.update,
			update( delta ) {
				this.element.pivot.set( this.pivot.x, this.pivot.y );
				this.updateTransform( delta );
				this.element.position.set( this.currentPosition.x, this.currentPosition.y );
				this.element.rotation = this.currentRotation;
			}
		}
		return Object.assign( {}, transformable, renderable, o );
	},
	/**
	 * Factory for TransformableGroups. See documentation for Group and Transformable
	 *
	 * @param Object options  See Group and Transformable
	 */
	TransformableGroup( options ) {
		const transformable = this.Transformable( options );
		const group = this.Group( options );

		let o = {
			updateTransform: transformable.update,
			update( delta ) {
				this.element.pivot.set( this.pivot.x, this.pivot.y );
				this.updateTransform( delta );
				this.element.position.set( this.currentPosition.x, this.currentPosition.y );
				this.element.rotation = this.currentRotation;
				for ( let key in this.children )
					this.children[ key ].update( delta );
			}
		}
		return Object.assign( {}, transformable, group, o );
	},
	/**
	 * Factory for renderables (options has a Sprite)
	 *
	 * @param Object options
	 *
	 * @param Object options.pivot     The pivot that will be assigned to the `Sprite` on each update.
	 * @param number options.pivot.x   The x coordinate of pivot
	 * @param number options.pivot.y   The y coordinate of pivot
	 *
	 * @param Object options.anchor    The anchor that will be assigned to the `Sprite` on each update.
	 * @param number options.ahcnor.x  The x coordinate of pivot
	 * @param number options.ahcnor.y  The y coordinate of pivot
	 */
	Renderable( options, o = {} ) {
		if ( !options || !options.element ) throw new Error( 'No Sprite provided to renderable' );

		return Object.assign( this.Group( options ), {
			anchor: options.anchor || { x: options.element.anchor.x, y: options.element.anchor.y }
		} );
	},
	/**
	 * Factory for groups (options has a Container)
	 *
	 * @param Object options
	 * @param Object options.pivot     The pivot that will be assigned to the `Sprite` on each update.
	 * @param number options.pivot.x   The x coordinate of pivot
	 * @param number options.pivot.y   The y coordinate of pivot
	 */
	Group( options, o = {} ) {
		let element = options.element || new Container();

		return Object.assign( o, {
			parent: null,
			children: Object.create( null ),
			addChild( key, child, init ) {
				this.children[ key ] = child;
				this.element.addChild( child.element );
				child.parent = this;
				if ( typeof init === 'function' ) init( child, this );
			},
			element: element,
			pivot: options.pivot || { x: element.pivot.x, y: element.pivot.y }
		} );
	},
	/**
	 * Factory for transformables
	 * 
	 * @param Object options
	 *
	 * @param number options.baseRotation  The rotation that will be considered 'zeroed' for the `transformable`
	 *
	 * @param Object options.basePosition    The position that will be considered 'zeroed' for the `transformable`
	 * @param number options.basePosition.x  The position's x coordinate
	 * @param number options.basePosition.y  The position's y coordinate
	 *
	 * @param number options.maxPositionVelocity        The maximum scalar velocity the transformable can move. Converted to x/y when used.
	 * @param number options.positionVelocityIncrement  The rate at which positionVelocity will increment or decrement.
	 * @param number options.maxRotationVelocity        The maximum velocity the transformable can rotate at.
	 * @param number options.rotationVelocityIncrement  The rate at which rotationVelocity will increment or decrement.
	 */
	Transformable( options, o = {} ) {
		/**
		 * Enum-like immutable object with 3 states.
		 */
		const TernaryState = Object.freeze( {
			MINUS: -1,
			EQUAL: 0,
			PLUS: 1
		} );

		return Object.assign( o, {
			// "zeroed" settings
			baseRotation: options.baseRotation || 0,
			basePosition: options.basePosition || { x: 0, y: 0 },
			// current settings, updated each render
			currentRotation: options.startRotation || options.baseRotation || 0,
			currentPosition: options.startPosition || options.basePosition || { x: 0, y: 0 },
			// position velocity/acceleration settings
			positionVelocity: 0,
			maxPositionVelocity: options.maxPositionVelocity || 2,
			positionVelocityIncrement: options.positionVelocityIncrement || .01,
			positionAcceleration: TernaryState.EQUAL,
			// rotation velocity/acceleration settings
			rotationVelocity: 0,
			maxRotationVelocity: options.maxRotationVelocity || 0.02,
			rotationVelocityIncrement: options.rotationVelocityIncrement || 0.001,
			rotationAcceleration: TernaryState.EQUAL,
			calculateVelocity( delta, acceleration, velocity, increment, limit ) {
				let calculated = velocity;
				switch ( acceleration ) {
					case TernaryState.MINUS:
						calculated = Math.max( velocity - ( delta * increment ), -limit );
						break;
					case TernaryState.PLUS:
						calculated = Math.min( velocity + ( delta * increment ), limit );
						break;
					case TernaryState.EQUAL:
					default:
						if ( velocity > 0 ) {
							calculated = Math.max( velocity - ( delta * increment ), 0 );
						} else if ( velocity < 0 ) {
							calculated = Math.min( velocity + ( delta * increment ), limit );

						} else {
							calculated = velocity;
						}
						break;
				}

				return calculated;
			},
			update( delta ) {
				this.rotationVelocity = this.calculateVelocity(
						delta,
						this.rotationAcceleration,
						this.rotationVelocity,
						this.rotationVelocityIncrement,
						this.maxRotationVelocity
					);

				this.currentRotation = this.normalizeAngle( this.currentRotation + this.rotationVelocity * delta);

				this.positionVelocity = this.calculateVelocity(
						delta,
						this.positionAcceleration,
						this.positionVelocity,
						this.positionVelocityIncrement,
						this.maxPositionVelocity
					);
				// convert scalar velocity to x/y velocities
				// @TODO break this out
				let vx = this.positionVelocity * Math.sin( this.currentRotation ),
					vy = -this.positionVelocity * Math.cos( this.currentRotation );

				this.currentPosition.x += vx * delta;
				this.currentPosition.y += vy * delta;
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
			}
		} );
	}
}
