'use strict'

//{INCLUDES}
const Util = require( './inc/util.js' );
const GameModels = require( './inc/game-models.js' );
//{/INCLUDES}

const Config = {
	spriteSheetPath: 'assets/spritesheets/',
	gameModels: [
		{
			name: 'turtle',
			spriteSheet: 'ships.json',
			options: {
				currentPosition: { x: 200, y: 300 },
				// rotationConstraints: { pos: Infinity, neg: Infinity },
				// positionConstraints: { pos: { x: Infinity, y: Infinity }, neg: { x: Infinity, y: Infinity } },
				maxForwardVelocity: 4,
				forwardVelocityIncrement: .05,
				postUpdates: [
					function( delta ) {
						// console.log( this.children[ 'rudder' ].currentRotation );
						// console.log( this.rotationVelocity );
						// this.children[ 'rudder' ].currentRotation = -this.currentRotation;
						// this.children[ 'rudder' ].rotationVelocity = -this.rotationVelocity;
					}
				]
			},

			init: ( base ) => {
				console.log( 'turtle' );
				base.pivot.x = base.sprite.width / 2;
				base.pivot.y = base.sprite.height;
				base.children.rudder.currentPosition.x = base.sprite.width / 2;
				base.children.rudder.basePosition.x = base.sprite.width / 2;
				base.children.rudder.basePosition.y = 110;
			},
			children: [
				{
					name: 'body',
					id: 'turtle-body.png',
					options: {
						// basePosition: { x: 15, y: 0 },
						rotationConstraints: { pos: 0, neg: 0 },
						positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
						postUpdates: [
							function( delta ) {
								// this.parent.
								// console.log(this.parent);
								// console.log( this.children[ 'rudder' ].currentRotation );
								// console.log( this.rotationVelocity );
								// this.children[ 'rudder' ].currentRotation = -this.currentRotation;
								// this.children[ 'rudder' ].rotationVelocity = -this.rotationVelocity;
							}
						]
					},
					init: ( child, parent) => {
						console.log('body');
						// child.pivot.x = parent.width / 2;
					}
				},
				{
					name: 'rudder',
					id: 'turtle-rudder.png',
					options: {
						// basePosition: { x: 46.23439168930054, y: 110 },
						rotationConstraints: { pos: Util.toRadians( 20 ), neg: Util.toRadians( 20 ) },
						positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
						maxRotationVelocity: 0.02,
						rotationVelocityIncrement: 0.01,
						stabilizeRotation: true,
						debug: true
					},
					init: ( child , parent ) => {
						console.log('rudder');
						child.pivot.x = child.sprite.width / 2;

						child.currentPosition.x = parent.sprite.width / 2;
						child.basePosition.x = child.currentPosition.x;
					}
				}
			]
		}
	]
};

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

window.current = {
	direction: 45,
	force: 1
}

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
		// convert current.force to directional compoents and apply to boat position
		// gameModels[ i ].base.currentPosition.y += current.force * math.sin(math.unit(current.direction, 'deg'));
		// gameModels[ i ].base.currentPosition.x += current.force * math.cos(math.unit(current.direction, 'deg'));
		gameModels[ i ].base.update( delta, {
			velocities: [ {
				x: current.force * math.cos( math.unit( current.direction, 'deg' ) ),
				y: current.force * math.sin( math.unit( current.direction, 'deg' ) )
			} ]
		} );
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
		// turtle.rotationAcceleration = ternaryState.MINUS;
		turtle.children[ 'rudder' ].rotationAcceleration = ternaryState.PLUS;
	}
	A.release = () => {
		if ( !D.isDown ) {
			// turtle.rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'rudder' ].rotationAcceleration = ternaryState.EQUAL;
		}
	}

	D.press = () => {
		// turtle.rotationAcceleration = ternaryState.PLUS;
		turtle.children[ 'rudder' ].rotationAcceleration = ternaryState.MINUS;
		// turtle.children[ 'rudder' ].stabilizingRotation = false;
	}
	D.release = () => {
		if ( !A.isDown ) {
			// turtle.rotationAcceleration = ternaryState.EQUAL;
			turtle.children[ 'rudder' ].rotationAcceleration = ternaryState.EQUAL;
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
