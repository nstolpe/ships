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

let graphics;

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
		let model = gameModels[ i ];

		model.base.update( delta, {
			velocities: [ {
				x: window.current.force * math.cos( math.unit( window.current.direction, 'deg' ) ),
				y: window.current.force * math.sin( math.unit( window.current.direction, 'deg' ) )
			} ],
			frictions: [ window.friction ]
		} );

		// Debug Display Logic
		// @TODO move this out
		if ( model.base.debug ) {
			let stageGraphics = app.stage.children.find( ( c ) => PIXI.Graphics.prototype.isPrototypeOf( c ) );
			let modelGraphics = model.base.sprite.children.find( ( c ) => PIXI.Graphics.prototype.isPrototypeOf( c ) );

			if ( stageGraphics ) {
				stageGraphics.clear();
			} else {
				stageGraphics = new PIXI.Graphics();
				app.stage.addChild( stageGraphics );
			}

			if ( modelGraphics ) {
				modelGraphics.clear();
			} else {
				modelGraphics = new PIXI.Graphics();
				model.base.sprite.addChild( modelGraphics );
			}

			if ( model.base.sprite.hitArea ) {
				modelGraphics.lineStyle( 1, 0xf1ff32, 1 );
				modelGraphics.moveTo( model.base.sprite.hitArea.x, model.base.sprite.hitArea.y );
				modelGraphics.lineTo( model.base.sprite.hitArea.x, model.base.sprite.hitArea.y + model.base.sprite.hitArea.height );
				modelGraphics.lineTo( model.base.sprite.hitArea.x + model.base.sprite.hitArea.width, model.base.sprite.hitArea.y + model.base.sprite.hitArea.height );
				modelGraphics.lineTo( model.base.sprite.hitArea.x + model.base.sprite.hitArea.width, model.base.sprite.hitArea.y  );
				modelGraphics.lineTo( model.base.sprite.hitArea.x, model.base.sprite.hitArea.y );
			}

			let bounds = model.base.sprite.getBounds();

			stageGraphics.lineStyle( 1, 0xff4cc7, 1 );
			stageGraphics.moveTo( bounds.x, bounds.y );
			stageGraphics.lineTo( bounds.x, bounds.y + bounds.height );
			stageGraphics.lineTo( bounds.x + bounds.width, bounds.y + bounds.height );
			stageGraphics.lineTo( bounds.x + bounds.width, bounds.y );
			stageGraphics.lineTo( bounds.x, bounds.y );
		} else {
			let stageGraphics = app.stage.children.find( ( c ) => PIXI.Graphics.prototype.isPrototypeOf( c ) );
			let modelGraphics = model.base.sprite.children.find( ( c ) => PIXI.Graphics.prototype.isPrototypeOf( c ) );

			if ( stageGraphics )
				app.stage.removeChild( stageGraphics );

			if ( modelGraphics )
				model.base.sprite.removeChild( modelGraphics );
		}
		// END Debug Display Logic
	}

	checkScreenBounds( turtle, { left: 0, right: app.view.offsetWidth, top: 0, bottom: app.view.offsetHeight } );
}

/**
 * Checks if an object is withing the screen bounds. Could have a better name.
 */
function checkScreenBounds( rigidBody, bounds ) {
	let lt = rigidBody.sprite.localTransform.apply( new PIXI.Point( rigidBody.sprite.hitArea.left, rigidBody.sprite.hitArea.top ), new PIXI.Point() );
	let lb = rigidBody.sprite.localTransform.apply( new PIXI.Point( rigidBody.sprite.hitArea.left, rigidBody.sprite.hitArea.bottom ), new PIXI.Point() );
	let rt = rigidBody.sprite.localTransform.apply( new PIXI.Point( rigidBody.sprite.hitArea.right, rigidBody.sprite.hitArea.top ), new PIXI.Point() );
	let rb = rigidBody.sprite.localTransform.apply( new PIXI.Point( rigidBody.sprite.hitArea.right, rigidBody.sprite.hitArea.bottom ), new PIXI.Point() );

	// left
	if ( rigidBody.sprite.getBounds().x <= bounds.left ) {
		console.log( 'left' );
		if ( lt.x <= 0 || rb.x <= 0 ) {
			console.log( 'lt.x || rb.x' );
			let distance = Math.abs( lt.x - rb.x );
			rigidBody.currentPosition.x = Math.ceil( distance / 2 );
			rigidBody.forwardVelocity = 0;
		}

		if ( lb.x <= 0 || rt.x <= 0 ) {
			console.log( 'lb.x || rt.x' );
			let distance = Math.abs( lb.x - rt.x );
			rigidBody.currentPosition.x = Math.ceil( distance / 2 );
		}
	}

	// right
	if ( rigidBody.sprite.getBounds().x + rigidBody.sprite.getBounds().width >= bounds.right ) {
		if ( lt.x >= bounds.right || rb.x >= bounds.right ) {
			let distance = Math.abs( lt.x - rb.x );
			rigidBody.currentPosition.x = app.view.offsetWidth - Math.ceil( distance / 2 );
			rigidBody.forwardVelocity = 0;
		}

		if ( lb.x >= app.view.offsetWidth || rt.x >= app.view.offsetWidth ) {
			let distance = Math.abs( lb.x - rt.x );
			rigidBody.currentPosition.x = app.view.offsetWidth - Math.ceil( distance / 2 );
		}
	}

	// top
	if ( rigidBody.sprite.getBounds().y <= bounds.top ) {
		console.log( 'top' );
		if ( lt.y <= bounds.top || rb.y <= bounds.top ) {
			console.log( 'lt.y || rb.y' );
			let distance = Math.abs( lt.y - rb.y );
			rigidBody.currentPosition.y = Math.ceil( distance / 2 );
			rigidBody.forwardVelocity = 0;
		}

		if ( lb.y <= bounds.top || rt.y <= bounds.top ) {
			console.log( 'lb.y || rt.y' );
			let distance = Math.abs( lb.y - rt.y );
			rigidBody.currentPosition.y = Math.ceil( distance / 2 );
		}
	}

	// bottom
	if ( rigidBody.sprite.getBounds().y + rigidBody.sprite.getBounds().height >= bounds.bottom ) {
		console.log( 'top' );
		if ( lt.y >= bounds.bottom || rb.y >= bounds.bottom ) {
			console.log( 'rb.y || rb.y' );
			let distance = Math.abs( lt.y - rb.y );
			rigidBody.currentPosition.y = app.view.offsetHeight - Math.ceil( distance / 2 );
			rigidBody.forwardVelocity = 0;
		}

		if ( lb.y >= bounds.bottom || rt.y >= bounds.bottom ) {
			console.log( 'lb.y || rt.y' );
			let distance = Math.abs( lb.y - rt.y );
			rigidBody.currentPosition.y = app.view.offsetHeight - Math.ceil( distance / 2 );
		}
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
