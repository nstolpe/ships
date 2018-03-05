'use strict';
const Vec2 = require( './vector2.js');

function Shape( options ) {
	const propsData = {
		color: 0x000000,
		mass: 0,
		forces: [],
		preUpdates: [],
		postUpdates: [],
		position: Vec2()
	};

	const props = {
		position:{
			enumerable: true,
			get: () => propsData.position,
			set: ( position ) => {
				propsData.position.set( position );
			}
		},
		color: {
			enumerable: true,
			get: () => propsData.color,
			set: ( color ) => propsData.color = color === 'null' || isNaN( color ) ? propsData.color : parseFloat( color )
		},
		mass: {
			enumerable: true,
			get: () => propsData.mass,
			set: ( mass ) => propsData.mass = isNaN( mass ) ? propsData.mass : parseFloat( mass )
		},
		velocity: {
			value: Vec2( 0, 0 ),
			enumerable: true,
			writable: true
		},
		forces: {
			enumerable: true,
			get: () => propsData.forces,
			// propsData.forces is always the same array. Errors in update. Good? Bad? Weird? Warning for this set?
			set: ( forces ) => Array.isArray( forces ) ? Array.prototype.push.apply( propsData.forces, forces ) : false
		},
		preUpdates: {
			enumerable: true,
			get: () => propsData.preUpdates,
			set: ( preUpdates ) => Array.isArray( preUpdates ) ? Array.prototype.push.apply( propsData.preUpdates, preUpdates ) : false
		},
		postUpdates: {
			enumerable: true,
			get: () => propsData.postUpdates,
			set: ( postUpdates ) => Array.isArray( postUpdates ) ? Array.prototype.push.apply( propsData.postUpdates, postUpdates ) : false
		},
		static: {
			enumerable: true,
			value: false,
			writable: true
		},
		preUpdate: {
			value: function( delta ) {
				for ( let i = 0, l = this.preUpdates.length; i < l; i++ )
					this.preUpdates[ i ].call( this, delta );
			}
		},
		postUpdate: {
			value: function( delta ) {
				for ( let i = 0, l = this.postUpdates.length; i < l; i++ )
					this.postUpdates[ i ].call( this, delta );
			}
		},
		update: {
			value: function( options, delta ) {
				this.preUpdate( delta );
				this.color = options.color || this.color;
				this.position = options.position,
				this.radius = isNaN( options.radius ) ? this.radius : options.radius;
				this.mass = isNaN( options.mass ) ? this.mass : options.mass;
				this.velocity = options.velocity || this.velocity;
				this.postUpdate( delta );
			},
			writable: true
		}
	};

	const shape = Object.create( {}, props );

	shape.color = options.color;
	shape.mass = options.mass;
	shape.forces = options.forces;
	shape.preUpdates = options.preUpdates;
	shape.postUpdates = options.postUpdates;
	shape.position = options.position;

	return shape;
};

module.exports = {
	Circle( options ) {
		const base = Shape( options );

		const propsData = {
			radius: 50,
		};

		const props = {
			radius: {
				enumerable: true,
				get: () => propsData.radius,
				set: ( radius ) => propsData.radius = typeof radius === 'null' || isNaN( radius ) ? propsData.radius : parseFloat( radius )
			},
			drawMethod: {
				value: 'drawCircle'
			},
			drawArgs: {
				value: function() {
					return [
						this.position.x,
						this.position.y,
						this.radius
					];
				}
			},
			update: {
				value: function( options, delta ) {
					this.preUpdate( delta );
					base.update( options, delta );
					this.postUpdate( delta );
				}
			}
		};

		const circle = Object.create( base, props );

		circle.radius = options.radius;

		return circle;
	},
	Rectangle( options ) {
		const base = Shape( options );

		return Object.assign( base, {
			dimensions: 0,
			drawMethod: {
				value: 'drawRectangle'
			},
			drawArgs: {
				value: function() {
					return [
						this.position.x,
						this.position.y,
						this.dimensions.w,
						this.dimensions.h
					];
				}
			},
			update: {
				value: function( options, delta ) {
					this.preUpdate( delta );
					base.update( options, delta );
					this.postUpdate( delta );
				}
			}
		} );
	}
};
