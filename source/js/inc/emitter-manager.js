'use strict';

module.exports = function( config, parent, textures, dimensions, emitterCount ) {
	return {
		config: config,
		parent: parent,
		textures: textures,
		dimensions: dimensions,
		emitters: [],
		emitterCount: emitterCount,
		elapsed: 0,
		createEmitterInstance( baseEmitterConfig, textures ) {
			const minPos = 0;
			const maxPos = 600;
			let emitterContainer = new PIXI.Container();
			let emitterConfig = Object.assign( baseEmitterConfig, {
				emitterLifetime: Math.random() * ( 10 - 3 ) + 3
			} );

			let emitter = new PIXI.particles.Emitter(
				emitterContainer,
				textures,
				emitterConfig
			);

			this.parent.addChild( emitterContainer );

			emitter.update( 0 );

			emitter.ownerPos.x = Math.floor( Math.random() * ( dimensions.w - 0 ) ) + 0;
			emitter.ownerPos.y = Math.floor( Math.random() * ( dimensions.h - 0 ) ) + 0;

			return emitter;
		},
		start() {
			for ( let i = 0; i < this.emitterCount; i++)
				this.emitters[ i ] = this.createEmitterInstance( this.config, this.textures );

			this.elapsed = Date.now();
		},
		update( delta ) {
			let now = Date.now();

			for ( let i = 0, l = this.emitters.length; i < l; i ++ ) {
				let emitter = this.emitters[ i ];
				emitter.update( ( now - this.elapsed ) * 0.001 );
				emitter.ownerPos.x += ( now - this.elapsed ) * 0.01;
				emitter.ownerPos.y += ( now - this.elapsed ) * 0.01;
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
