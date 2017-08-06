'use strict';

const math = require( 'mathjs' );
const Vec = require( 'victor' );
const PIXI = require( 'pixi.js' );
const particles = require( 'pixi-particles' );

const view = document.getElementById( 'view' );
const viewWidth = 1000;
const viewHeight = 800;
const app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x02bdf1 } );

const loader = PIXI.loader;

let emitters = [];
let elapsed;

function animate( delta ) {
	let now = Date.now();

	for ( let i = 0, l = emitters.length; i < l; i ++ ) {
		let emitter = emitters[ i ];
		emitter.update( ( now - elapsed ) * 0.001 );
		emitter.ownerPos.x += ( now - elapsed ) * 0.01;
		emitter.ownerPos.y += ( now - elapsed ) * 0.01;
		if ( !emitter.emit && emitter.particleCount <= 0 ) {
			app.stage.removeChild( emitter.parent );
			emitter.destroy();
			emitters[ i ] = undefined;
			createEmitterInstance(
				loader.resources.emitter.data,
				[
					// loader.resources.pixel.texture,
					// loader.resources['2-pixel'].texture,
					loader.resources['particle'].texture
				]
			);
		}
	}

	emitters = emitters.filter( ( e ) => e !== undefined );
	window.emitters = emitters;

	elapsed = now;
}

function createEmitterInstance( baseEmitterConfig, textures ) {
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

	app.stage.addChild( emitterContainer );

	emitter.update( 0 );

	emitter.ownerPos.x = Math.floor( Math.random() * ( viewWidth - 0 ) ) + 0;
	emitter.ownerPos.y = Math.floor( Math.random() * ( viewHeight - 0 ) ) + 0;

	emitters.push( emitter );
}

function setup( loader, resources ) {
	for ( let i = 0; i < 15; i++) {
			createEmitterInstance(
				resources.emitter.data,
				[
					// resources.pixel.texture,
					// resources['2-pixel'].texture,
					resources['particle'].texture,
				]
			);
	}

	elapsed = Date.now();

	app.ticker.add( animate );

	window.PIXI = PIXI;
	window.app = app;
	window.emitters = emitters;
}

loader
	.add( 'particle', 'assets/images/particle.png' )
	.add( 'pixel', 'assets/images/pixel.png' )
	.add( '2-pixel', 'assets/images/2-pixel.png' )
	// .add( '3-pixel', 'assets/images/3-pixel.png' )
	.add( 'emitter', 'assets/data/emitter.json' )
	.load( setup );
