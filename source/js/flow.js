'use strict'

const Util = require( './inc/util.js' );
const WaterFilter = require( './inc/water-filter.js' );
const math = require( 'mathjs' );
const PIXI = require( 'pixi.js' );
const view = document.getElementById('view');
const viewWidth = 1000;
const viewHeight = 800;
const scale = window.devicePixelRatio;
const app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x555555, resolution: window.devicePixelRatio >= 2 ? 2 : 1 } );

function setup() {
	app.ticker.add( animate );
	let flowMap = new PIXI.Sprite( PIXI.loader.resources[ 'flow-map' ].texture );
	let flowNoiseMap = new PIXI.Sprite( PIXI.loader.resources[ 'flow-noise' ].texture );
	let flowNormal = new PIXI.Sprite( PIXI.loader.resources[ 'flow-normal0' ].texture );
	let flowNornal1 = new PIXI.Sprite( PIXI.loader.resources[ 'flow-normal1' ].texture );
	
	let floor = PIXI.extras.TilingSprite.fromImage(
		'floor',
		viewWidth,
		viewHeight
	);

	floor.x = viewWidth / 2;
	floor.y = viewHeight / 2;
	floor.anchor.set( 0.5 );
	floor.filters = [ WaterFilter() ];

	app.stage.addChild( floor );

	let animatedWater = new PIXI.extras.AnimatedSprite( [ 
		PIXI.loader.resources[ 'water-00' ].texture,
		PIXI.loader.resources[ 'water-01' ].texture,
		PIXI.loader.resources[ 'water-02' ].texture,
		PIXI.loader.resources[ 'water-03' ].texture,
		PIXI.loader.resources[ 'water-04' ].texture
	] );
window.animatedWater = animatedWater;
window.floor = floor;
	animatedWater.x = viewWidth / 2;
	animatedWater.y = viewHeight / 2;
	animatedWater.anchor.set( 0.5 );
	animatedWater.animationSpeed = 0.2;
	animatedWater.gotoAndPlay( 0 );

	app.stage.addChild( animatedWater );
}

function animate( delta ) {
	// console.log( 'animating' );
	floor.tilePosition.x += 4 * .01 / delta;
	floor.tilePosition.y += 13 * .01 / delta;
}

PIXI.loader
	.add( 'ships', 'assets/spritesheets/ships.json' )
	.add( 'flow-map', 'assets/images/flow/flow.jpg' )
	.add( 'flow-noise', 'assets/images/flow/noise.jpg' )
	.add( 'flow-normal0', 'assets/images/flow/normal0.jpg' )
	.add( 'flow-normal1', 'assets/images/flow/normal1.jpg' )
	.add( 'floor', 'assets/images/boxes-blue-red.png' )
	.add( 'water-00', 'assets/images/water-00.png' )
	.add( 'water-01', 'assets/images/water-01.png' )
	.add( 'water-02', 'assets/images/water-02.png' )
	.add( 'water-03', 'assets/images/water-03.png' )
	.add( 'water-04', 'assets/images/water-04.png' )
	.load( setup );
