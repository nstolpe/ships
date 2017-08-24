'use strict';

const Util = require( './util.js' );
const Vec2 = require( './vector2.js' );

module.exports = function( config, parent, textures, dimensions, emitterCount, direction ) {
	return {
		config: config,
		parent: parent,
		textures: textures,
		dimensions: dimensions,
		emitters: [],
		emitterCount: emitterCount,
		direction: direction,
		elapsed: 0,
		createEmitterInstance( baseEmitterConfig, textures ) {
			let emitterContainer = new PIXI.Container();
			let emitterConfig = Object.assign( baseEmitterConfig, {
				emitterLifetime: Math.random() * ( 10 - 3 ) + 3,
				// startRotation: {
				// 	min: this.direction - 15,
				// 	max: this.direction - 15
				// }
			} );

			let emitter = new PIXI.particles.Emitter(
				emitterContainer,
				textures,
				emitterConfig
			);

			this.parent.addChild( emitterContainer );
			emitterContainer.pivot.x = emitterContainer.width / 2;
			emitterContainer.pivot.y = emitterContainer.height / 2;
			// emitterContainer.rotation = Util.toRadians( this.direction );
			emitter.update( 0 );

			emitterContainer.position.x = Math.floor( Math.random() * ( this.dimensions.w - 0 ) ) + 0;
			emitterContainer.position.y = Math.floor( Math.random() * ( this.dimensions.h - 0 ) ) + 0;

			return emitter;
		},
		start() {
			for ( let i = 0; i < this.emitterCount; i++)
				this.emitters[ i ] = this.createEmitterInstance( this.config, this.textures );

			this.elapsed = Date.now();
		},
		update( delta, forces ) {
			let now = Date.now();

			for ( let i = 0, l = this.emitters.length; i < l; i ++ ) {
				let emitter = this.emitters[ i ];
				let accumulated = { x: 0, y: 0 };

				emitter.update( ( now - this.elapsed ) * 0.001 );

				for ( let ii = 0, ll = forces.length; ii < ll; ii++ ) {
					let force = forces[ ii ];

					accumulated.x += force.force * math.cos( math.unit( force.direction, 'deg' ) );
					accumulated.y += force.force * math.sin( math.unit( force.direction, 'deg' ) );
				}
				emitter.rotation = Vec2( accumulated.x, accumulated.y ).angle();
				emitter.ownerPos.x += accumulated.x * delta;
				emitter.ownerPos.y += accumulated.y * delta;
				if ( !emitter.emit && emitter.particleCount <= 0 ) {
					this.parent.removeChild( emitter.parent );
					emitter.destroy();
					this.emitters[ i ] = this.createEmitterInstance( this.config, this.textures );
				}
			}

			// remove the emitters that expired in this update.
			this.emitters = this.emitters.filter( ( e ) => e !== undefined );
			this.elapsed = now;
		}
	}
}
