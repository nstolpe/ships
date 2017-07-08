'use strict'

const Config = require( './inc/config.js' );
const Util = require( './inc/util.js' );
const GameModels = require( './inc/game-models.js' );
const SteeringKeyboard = require( './inc/steering-keyboard.js' );

window.math = require( 'mathjs' );
const PIXI = require( 'pixi.js' ),
	TextureCache = PIXI.utils.TextureCache,
	Sprite = PIXI.Sprite,
	loader = PIXI.loader,
	view = document.getElementById('view'),
	viewWidth = 1000,
	viewHeight = 800,
	scale = window.devicePixelRatio,
	// app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x000000 } );
	app = new PIXI.Application( viewWidth * scale, viewHeight * scale, { view: view, backgroundColor : 0x000000 } );

window.app = app;
window.PIXI = PIXI;

app.stage.interactive = true;
app.stage.on( 'mousemove', (e) => {
	console.log( `x: ${ e.data.global.x }, y: ${ e.data.global.y }` );
} );

view.style.width = viewWidth + 'px';
view.style.height = viewHeight + 'px';

loader
	.add( "assets/spritesheets/ships.json" )
	.load( setup );

window.gameModels = [];
window.current = {
	direction: 90,
	force: .3
}

window.friction = 0.98;

function setup() {
	var id = PIXI.loader.resources[ Config.spriteSheetPath + "ships.json" ].textures;
	gameModels = loadGameModels();
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		app.stage.addChild( gameModels[ i ].base.sprite );
	}

	SteeringKeyboard();
	app.ticker.add( animate );
}

function rudder() {

}

function animate( delta ) {
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		gameModels[ i ].base.update( delta, {
			velocities: [ {
				x: window.current.force * math.cos( math.unit( window.current.direction, 'deg' ) ),
				y: window.current.force * math.sin( math.unit( window.current.direction, 'deg' ) )
			} ],
			frictions: [ window.friction ]
		} );
	}
}

function loadGameModels() {
	let gameModels = [];
	for ( let i = Config.gameModels.length - 1; i >= 0; i-- ) {
		// gameModels.push( loadGameModel( Config.gameModels[ i ] ) );
	}

	window.rudder = loadGameModel(
		{
			name: 'rudder',
			spriteSheet: 'ships.json',
			options: {
				basePosition: { x: 400, y: 400 },
				// rotationConstraints: { pos: Infinity, neg: Infinity },
				positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
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
				// size this here for now.
				// base.sprite.width *= 4;
				// base.sprite.height *= 4;

				base.pivot.x = base.sprite.width / 2;
				// base.pivot.y = base.sprite.height;
				// base.children.rudder.currentPosition.x = base.sprite.width / 2;
				// base.children.rudder.basePosition.x = base.sprite.width / 2;
			},
			children: [
				{
					name: 'rudder',
					id: 'turtle-rudder.png',
					options: {
						// basePosition: { x: 46.23439168930054, y: 110 },
						// rotationConstraints: { pos: Util.toRadians( 20 ), neg: Util.toRadians( 20 ) },
						// positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
						// maxRotationVelocity: 0.02,
						// rotationVelocityIncrement: 0.01,
						// stabilizeRotation: true,
						// debug: true
					},
					init: ( child , parent ) => {
						// child.pivot.x = child.sprite.width / 2;

						// child.currentPosition.x = parent.sprite.width / 2;
						// child.basePosition.x = child.currentPosition.x;
					}
				}
			]
		}
	);
	window.rudder.base.sprite.width *= 2;
	window.rudder.base.sprite.height *= 2;
	gameModels.push( window.rudder );
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
