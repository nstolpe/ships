'use strict'

const Util = require( './inc/util.js' );
const SteeringKeyboard = require( './inc/steering-keyboard.js' );
const GameModels = require( './inc/game-models.js' );
const WaterManager = require( './inc/water-manager.js' );
const AnimatedTilingSprite = require( './inc/animated-tiling-sprite.js' );

window.math = require( 'mathjs' );
const PIXI = require( 'pixi.js' ),
	Sprite = PIXI.Sprite,
	loader = PIXI.loader,
	view = document.getElementById('view'),
	viewWidth = 1000,
	viewHeight = 800,
	scale = window.devicePixelRatio,
	app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x000000, resolution: scale } );

const Config = require( './inc/config.js' )( PIXI, app );

window.app = app;
view.style.width = viewWidth + 'px';
view.style.height = viewHeight + 'px';

loader
	.add( "assets/spritesheets/ships.json" )
	.add( 'water-00', 'assets/images/water-00.png' )
	.add( 'water-01', 'assets/images/water-01.png' )
	.add( 'water-02', 'assets/images/water-02.png' )
	.add( 'water-03', 'assets/images/water-03.png' )
	.add( 'water-04', 'assets/images/water-04.png' )
	.load( setup );

window.gameModels = [];
window.current = {
	direction: 145,
	force: .3
}

window.friction = 0.98;

let waterManager = WaterManager( {
	uResolution: { type: 'v2', value: [ viewWidth, viewHeight ] },
} ).init();

var oceanFloor;

function setup() {
	var id = PIXI.loader.resources[ Config.spriteSheetPath + "ships.json" ].textures;
	gameModels = loadGameModels();
	oceanFloor = AnimatedTilingSprite(
		[
			PIXI.loader.resources[ 'water-00' ].texture,
			PIXI.loader.resources[ 'water-01' ].texture,
			PIXI.loader.resources[ 'water-02' ].texture,
			PIXI.loader.resources[ 'water-03' ].texture,
			PIXI.loader.resources[ 'water-04' ].texture
		],
		viewWidth,
		viewHeight
	);
	window.oceanFloor = oceanFloor;
	app.stage.addChild( oceanFloor );
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		app.stage.addChild( gameModels[ i ].base.sprite );
	}
	window.turtle = gameModels[ 0 ].base;
	turtle.sprite.width *= .5;
	turtle.sprite.height *= .5;
	SteeringKeyboard();

	app.ticker.add( animate );
}

function animate( delta ) {
	// waterManager.update( delta );
	oceanFloor.update( delta );
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		gameModels[ i ].base.update( delta, {
			velocities: [ {
				x: window.current.force * math.cos( math.unit( window.current.direction, 'deg' ) ),
				y: window.current.force * math.sin( math.unit( window.current.direction, 'deg' ) )
			} ],
			frictions: [ window.friction ]
		} );
	}

	let lt = turtle.sprite.localTransform.apply( new PIXI.Point( turtle.sprite.hitArea.left, turtle.sprite.hitArea.top ), new PIXI.Point() );
	let lb = turtle.sprite.localTransform.apply( new PIXI.Point( turtle.sprite.hitArea.left, turtle.sprite.hitArea.bottom ), new PIXI.Point() );
	let rt = turtle.sprite.localTransform.apply( new PIXI.Point( turtle.sprite.hitArea.right, turtle.sprite.hitArea.top ), new PIXI.Point() );
	let rb = turtle.sprite.localTransform.apply( new PIXI.Point( turtle.sprite.hitArea.right, turtle.sprite.hitArea.bottom ), new PIXI.Point() );

	// left
	if ( lt.x <= 0 || rb.x <= 0 ) {
		let xDistance = Math.abs( lt.x - rb.x );
		turtle.currentPosition.x = Math.ceil( xDistance / 2 );
		turtle.forwardVelocity = 0;
	}

	if ( lb.x <= 0 || rt.x <= 0 ) {
		let xDistance = Math.abs( lb.x - rt.x );
		turtle.currentPosition.x = Math.ceil( xDistance / 2 );
	}

	// right
	if ( lt.x >= app.view.offsetWidth || rb.x >= app.view.offsetWidth ) {
		let xDistance = Math.abs( lt.x - rb.x );
		turtle.currentPosition.x = app.view.offsetWidth - Math.ceil( xDistance / 2 );
		turtle.forwardVelocity = 0;
	}

	if ( lb.x >= app.view.offsetWidth || rt.x >= app.view.offsetWidth ) {
		let xDistance = Math.abs( lb.x - rt.x );
		turtle.currentPosition.x = app.view.offsetWidth - Math.ceil( xDistance / 2 );
	}

	// top
	if ( lt.y <= 0 || rb.y <= 0 ) {
		let yDistance = Math.abs( lt.y - rb.y );
		turtle.currentPosition.y = Math.ceil( yDistance / 2 );
		turtle.forwardVelocity = 0;
	}

	if ( lb.y <= 0 || rt.y <= 0 ) {
		let yDistance = Math.abs( lb.y - rt.y );
		turtle.currentPosition.y = Math.ceil( yDistance / 2 );
	}
	
	// bottom
	if ( lt.y >= app.view.offsetHeight || rb.y >= app.view.offsetHeight ) {
		let yDistance = Math.abs( lt.y - rb.y );
		turtle.currentPosition.y = app.view.offsetHeight - Math.ceil( yDistance / 2 );
		turtle.forwardVelocity = 0;
	}

	if ( lb.y >= app.view.offsetHeight || rt.y >= app.view.offsetHeight ) {
		let yDistance = Math.abs( lb.y - rt.y );
		turtle.currentPosition.y = app.view.offsetHeight - Math.ceil( yDistance / 2 );
	}
}

function loadGameModels() {
	let gameModels = [];
	for ( let i = Config.gameModels.length - 1; i >= 0; i-- ) {
		gameModels.push( loadGameModel( Config.gameModels[ i ] ) );
	}
	return gameModels;
}

function loadGameModel( model ) {
	const base = GameModels.TransformableGroup( model.options );

	for ( let i = 0, l = model.children.length; i < l; i++ ) {
		let child = model.children[ i ];
		let texture = PIXI.loader.resources[ Config.spriteSheetPath + model.spriteSheet ].textures[ child.id ];
		let sprite = new Sprite( texture );
		let tr = GameModels.TransformableRenderable( Object.assign( { sprite: sprite }, child.options ) );

		base.addChild( child.name, tr, child.init );
	}

	model.init( base );
	base.update( 0 );
	return { base: base }
}

function setupCoords() {
	const xValue = document.createElement( 'input' );
	const yValue = document.createElement( 'input' );

	xValue.type = 'number';
	xValue.type = 'number';
	yValue.disabled = true;
	yValue.disabled = true;
}
