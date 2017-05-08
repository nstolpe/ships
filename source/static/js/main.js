'use strict'

//{INCLUDES}
const Config = require( './inc/config.js' );
const Util = require( './inc/util.js' );
const GameModels = require( './inc/game-models.js' );
//{\INCLUDES}

window.math = require( 'mathjs' );
const PIXI = require( 'pixi.js' ),
	TextureCache = PIXI.utils.TextureCache,
	Sprite = PIXI.Sprite,
	loader = PIXI.loader,
	view = document.getElementById('view'),
	viewWidth = 1000,
	viewHeight = 800,
	scale = window.devicePixelRatio,
	app = new PIXI.Application( viewWidth * scale, viewHeight * scale, { view: view, backgroundColor : 0x000000 } ),
	ternaryState = Object.freeze( { 
		MINUS: -1,
		EQUAL: 0,
		PLUS: 1
	} );

view.style.width = viewWidth + 'px';
view.style.height = viewHeight + 'px';

loader
	.add( "../assets/spritesheets/ships.json" )
	.load( setup );

window.gameModels = [];

function setup() {
	var id = PIXI.loader.resources[ Config.spriteSheetPath + "ships.json" ].textures;
	gameModels = loadGameModels();
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		app.stage.addChild( gameModels[ i ].base.sprite );
	}
	window.turtle = gameModels[ 0 ].base;
	setupInput();
	app.ticker.add( animate );
}

function animate( delta ) {
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		gameModels[ i ].base.update( delta );
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

	base.update( 0 );
	model.init( base );
	return { base: base }
}

function setupInput() {
	let W = keyboard( 87 ),
		A = keyboard( 65 ),
		S = keyboard( 83 ),
		D = keyboard( 68 ),
		H = keyboard( 72 ),
		J = keyboard( 74 ),
		K = keyboard( 75 ),
		L = keyboard( 76 );

	W.press = () => {
		turtle.positionAcceleration = ternaryState.PLUS;
		turtle.activePositionAcceleration = true;
	}
	W.release = () => {
		if ( !S.isDown ) {
			turtle.positionAcceleration = ternaryState.EQUAL;
			turtle.activePositionAcceleration = false;
		}
	}

	S.press = () => {
		turtle.positionAcceleration = ternaryState.MINUS;
		turtle.activePositionAcceleration = true;
	}
	S.release = () => {
		if ( !W.isDown ) {
			turtle.positionAcceleration = ternaryState.EQUAL;
			turtle.activePositionAcceleration = false;
		}
	}

	A.press = () => {
		turtle.rotationAcceleration = ternaryState.MINUS;
		turtle.children[ 'rudder' ].rotationAcceleration = ternaryState.PLUS;
	}
	A.release = () => {
		if ( !D.isDown ) {
			turtle.rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'rudder' ].rotationAcceleration = ternaryState.EQUAL;
		}
	}

	D.press = () => {
		turtle.rotationAcceleration = ternaryState.PLUS;
		turtle.children[ 'rudder' ].rotationAcceleration = ternaryState.MINUS;
		turtle.children[ 'rudder' ].stabilizingRotation = false;
	}
	D.release = () => {
		if ( !A.isDown ) {
			turtle.rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'rudder' ].rotationAcceleration = ternaryState.EQUAL;
		}
	}

	H.press = () => {
		turtle.children[ 'cannon-left-mid' ].rotationAcceleration = ternaryState.PLUS;
		turtle.children[ 'cannon-left-bow' ].rotationAcceleration = ternaryState.PLUS;
		turtle.children[ 'cannon-left-aft' ].rotationAcceleration = ternaryState.PLUS;
	}
	H.release = () => {
		if ( !J.isDown ) {
			turtle.children[ 'cannon-left-mid' ].rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'cannon-left-bow' ].rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'cannon-left-aft' ].rotationAcceleration = ternaryState.EQUAL;
		}
	}

	J.press = () => {
		turtle.children[ 'cannon-left-mid' ].rotationAcceleration = ternaryState.MINUS;
		turtle.children[ 'cannon-left-bow' ].rotationAcceleration = ternaryState.MINUS;
		turtle.children[ 'cannon-left-aft' ].rotationAcceleration = ternaryState.MINUS;
	}
	J.release = () => {
		if ( !H.isDown ) {
			turtle.children[ 'cannon-left-mid' ].rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'cannon-left-bow' ].rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'cannon-left-aft' ].rotationAcceleration = ternaryState.EQUAL;
		}
	}

	K.press = () => {
		turtle.children[ 'cannon-right-mid' ].rotationAcceleration = ternaryState.PLUS;
		turtle.children[ 'cannon-right-bow' ].rotationAcceleration = ternaryState.PLUS;
		turtle.children[ 'cannon-right-aft' ].rotationAcceleration = ternaryState.PLUS;
	}
	K.release = () => {
		if ( !L.isDown ) {
			turtle.children[ 'cannon-right-mid' ].rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'cannon-right-bow' ].rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'cannon-right-aft' ].rotationAcceleration = ternaryState.EQUAL;
		}
	}

	L.press = () => {
		turtle.children[ 'cannon-right-mid' ].rotationAcceleration = ternaryState.MINUS;
		turtle.children[ 'cannon-right-bow' ].rotationAcceleration = ternaryState.MINUS;
		turtle.children[ 'cannon-right-aft' ].rotationAcceleration = ternaryState.MINUS;
	}
	L.release = () => {
		if ( !K.isDown ) {
			turtle.children[ 'cannon-right-mid' ].rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'cannon-right-bow' ].rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'cannon-right-aft' ].rotationAcceleration = ternaryState.EQUAL;
		}
	}
}

function keyboard( which ) {
	var key = {};
	key.which = which;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;
	
	//The `downHandler`
	key.downHandler = function( event ) {
		if ( event.which === key.which ) {
			if ( key.isUp && key.press ) key.press();
			key.isDown = true;
			key.isUp = false;
		}
		event.preventDefault();
	};

	//The `upHandler`
	key.upHandler = function( event ) {
		if ( event.which === key.which ) {
			if ( key.isDown && key.release ) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

	//Attach event listeners
	window.addEventListener( "keydown", key.downHandler.bind( key ), false );
	window.addEventListener( "keyup", key.upHandler.bind( key ), false );
	return key;
}
