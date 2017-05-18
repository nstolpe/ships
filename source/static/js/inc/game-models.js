'use strict'
const PIXI = require( 'pixi.js' );
const Sprite = PIXI.Sprite;
const Container = PIXI.Container;
const Util = require( './util.js' );

module.exports = {
	/**
	 * Factory for TransformableRenderables. See documentation for Renderable and Transformable
	 *
	 * @param Object options  See Renderable and Transformable
	 */
	TransformableRenderable( options ) {
		if ( !options || !options.sprite ) throw new Error( 'No Sprite provided to renderable' );
		const transformable = this.Transformable( options );
		const renderable = this.Renderable( options );
		let o = {
			updateTransform: transformable.update,
			update( delta ) {
				this.sprite.pivot.set( this.pivot.x, this.pivot.y );
				this.updateTransform( delta );
				this.sprite.position.set( this.currentPosition.x, this.currentPosition.y );
				this.sprite.rotation = this.currentRotation;
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
				this.sprite.pivot.set( this.pivot.x, this.pivot.y );
				this.updateTransform( delta );
				this.sprite.position.set( this.currentPosition.x, this.currentPosition.y );
				this.sprite.rotation = this.currentRotation;
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
	 * @param number options.anchor.x  The x coordinate of pivot
	 * @param number options.anchor.y  The y coordinate of pivot
	 */
	Renderable( options, o = {} ) {
		if ( !options || !options.sprite ) throw new Error( 'No Sprite provided to renderable' );

		return Object.assign( this.Group( options ), {
			anchor: options.anchor || { x: options.sprite.anchor.x, y: options.sprite.anchor.y }
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
		let sprite = options.sprite || new Container();

		return Object.assign( o, {
			parent: null,
			children: Object.create( null ),
			addChild( key, child, init ) {
				this.children[ key ] = child;
				this.sprite.addChild( child.sprite );
				child.parent = this;
				if ( typeof init === 'function' ) init( child, this );
			},
			sprite: sprite,
			pivot: options.pivot || { x: sprite.pivot.x, y: sprite.pivot.y }
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
	 * @param number options.maxForwardVelocity        The maximum scalar velocity the transformable can move. Converted to x/y when used.
	 * @param number options.forwardVelocityIncrement  The rate at which forwardVelocity will increment or decrement.
	 * @param number options.maxRotationVelocity        The maximum velocity the transformable can rotate at.
	 * @param number options.rotationVelocityIncrement  The rate at which rotationVelocity will increment or decrement.
	 */
	Transformable( options, o = {} ) {
		/**
		 * Enum-like immutable object with 3 states.
		 */
		const TrinaryState = Object.freeze( {
			NEGATIVE: -1,
			NEUTRAL: 0,
			POSITIVE: 1
		} );

		return Object.assign( o, {
			name: options.name || '',
			// "zeroed" settings
			baseRotation: options.baseRotation || 0,
			basePosition: options.basePosition || { x: 0, y: 0 },
			// current settings, updated each render
			currentRotation: options.currentRotation || options.baseRotation || 0,
			currentPosition: options.currentPosition || options.basePosition || { x: 0, y: 0 },
			rotationConstraints: options.rotationConstraints || { pos: Infinity, neg: Infinity },
			positionConstraints: options.positionConstraints || { pos: { x: Infinity, y: Infinity }, neg: { x: Infinity, y: Infinity } },
			// position velocity/acceleration settings
			forwardVelocity: 0,
			maxForwardVelocity: options.maxForwardVelocity || 2,
			forwardVelocityIncrement: options.forwardVelocityIncrement || .01,
			positionAcceleration: TrinaryState.NEUTRAL,
			// rotation velocity/acceleration settings
			rotationVelocity: 0,
			maxRotationVelocity: options.maxRotationVelocity || 0.02,
			rotationVelocityIncrement: options.rotationVelocityIncrement || 0.001,
			rotationAcceleration: TrinaryState.NEUTRAL,
			postUpdates: options.postUpdates || [],
			stabilizeRotation: options.stabilizeRotation || false,
			stabilizePosition: options.stabilizePosition || false,
			targetRotation: options.startRotation || options.baseRotation || 0,
			targetPosition: options.startPosition || options.basePosition || 0,
			// activePositionAcceleration: TrinaryState.NEUTRAL,
			// activeRotationAcceleration: TrinaryState.NEUTRAL,
			debug: options.debug || false,
			/**
			 * Calculates a new velocity based on a delta, a rate of acceleration, a current velocity, and increment multiplier and a velocity limit. 
			 *
			 * @param delta         Delta time from last frame or other increment
			 * @param acceleration  Value of TernaryState.NEGAVITE, TrinaryState.POSITIVE or TrinaryState.NEUTRAL
			 * @param velocity      Current velocity
			 * @param increment     Increment multiplier. Multiplied by delta, then added or subtracted to velocity.
			 * @param limit         The velocity limit. Controls above and below 0
			 *
			 * @TODO make limit take and upper and lower limit. { u: 0.02, l: 0.03 }
			 */
			calculateVelocity( delta, acceleration, velocity, increment, limit ) {
				let calculated = velocity;

				switch ( acceleration ) {
					case TrinaryState.NEGATIVE:
						calculated = Math.max( velocity - ( delta * increment ), -limit );
						break;
					case TrinaryState.POSITIVE:
						calculated = Math.min( velocity + ( delta * increment ), limit );
						break;
					case TrinaryState.NEUTRAL:
					default:
						// if ( velocity > 0 ) {
						// 	calculated = Math.max( velocity - ( delta * increment ), 0 );
						// } else if ( velocity < 0 ) {
						// 	calculated = Math.min( velocity + ( delta * increment ), 0 );
						// }
						calculated = Math.max( Math.abs( velocity ) - ( delta * increment ), 0 ) * Math.sign( velocity );
				}
				return calculated;
			},
			stabilizing() {
				return this.stabilizeRotation && this.rotationAcceleration === TrinaryState.NEUTRAL;
			},
			// setRotation
			update( delta ) {
				// if the Transformable will rotate back to its baseRotation and no rotationAcceleration is being applied
				if ( this.stabilizing() ) {
					// set rotation velocity
					if ( this.debug  && this.currentRotation !== 0 ) {
						// console.log(Math.sign( this.currentRotation - this.baseRotation ))
						// console.log(this.currentRotation)
					}

					// don't pass baseRotation 
					if ( this.currentRotation > this.baseRotation && this.rotationVelocity > 0 ) {
						this.rotationVelocity = 0;
					}
					if ( this.currentRotation < this.baseRotation && this.rotationVelocity < 0 ) {
						this.rotationVelocity = 0;
					}

					// set rotation velocity
					this.rotationVelocity = this.calculateVelocity(
						delta,
						Math.sign( this.baseRotation - this.currentRotation ),
						this.rotationVelocity,
						this.rotationVelocityIncrement,
						this.maxRotationVelocity
					);

					let targetRotation = this.normalizeAngle( this.currentRotation + this.rotationVelocity * delta );

					if ( this.currentRotation > this.baseRotation )
						this.currentRotation = Math.max( this.currentRotation + this.rotationVelocity * delta, this.baseRotation );
					if ( this.currentRotation < this.baseRotation )
						this.currentRotation = Math.min( this.currentRotation + this.rotationVelocity * delta, this.baseRotation );
				// if the transformable is not stabilizing (returning to a base rotation when in neutral acceleration).
				// positive acceleration, negative acceleration, and deceleration
				} else {
					// set rotation velocity
					this.rotationVelocity = this.calculateVelocity(
							delta,
							this.rotationAcceleration,
							this.rotationVelocity,
							this.rotationVelocityIncrement,
							this.maxRotationVelocity
						);

					this.currentRotation = this.normalizeAngle( this.currentRotation + this.rotationVelocity * delta );

					// check constraints, @TODO break this out too
					if ( this.currentRotation > this.baseRotation + this.rotationConstraints.pos )
						this.currentRotation = this.baseRotation + this.rotationConstraints.pos;

					if ( this.currentRotation < this.baseRotation - this.rotationConstraints.neg )
						this.currentRotation = this.baseRotation - this.rotationConstraints.neg;
				}

				this.updateVelocity( delta );

				// @TODO break this out
				let vx = this.forwardVelocity * Math.sin( this.currentRotation ),
					vy = -this.forwardVelocity * Math.cos( this.currentRotation );

				this.currentPosition.x += vx * delta;
				this.currentPosition.y += vy * delta;

				if ( this.currentPosition.x > this.basePosition.x + this.positionConstraints.pos.x )
					this.currentPosition.x = this.basePosition.x + this.positionConstraints.pos.x;

				if ( this.currentPosition.y > this.basePosition.y + this.positionConstraints.pos.y )
					this.currentPosition.y = this.basePosition.y + this.positionConstraints.pos.y;

				if ( this.currentPosition.x < this.basePosition.x - this.positionConstraints.neg.x )
					this.currentPosition.x = this.basePosition.x - this.positionConstraints.neg.x;

				if ( this.currentPosition.y < this.basePosition.y - this.positionConstraints.neg.y )
					this.currentPosition.y = this.basePosition.y - this.positionConstraints.neg.y;

				for ( let i = 0, l = this.postUpdates.length; i < l; i++ )
					this.postUpdates[ i ].call( this, delta );
			},
			updateVelocity( delta ) {
				this.forwardVelocity = this.calculateVelocity(
						delta,
						this.positionAcceleration,
						this.forwardVelocity,
						this.forwardVelocityIncrement,
						this.maxForwardVelocity
					);
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
