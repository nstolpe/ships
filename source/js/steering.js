'use strict'

const Util = require( './inc/util.js' );
const SteeringKeyboard = require( './inc/steering-keyboard.js' );
const GameModels = require( './inc/game-models.js' );
const WaterManager = require( './inc/water-manager.js' );

window.math = require( 'mathjs' );
const PIXI = require( 'pixi.js' ),
	Sprite = PIXI.Sprite,
	loader = PIXI.loader,
	view = document.getElementById('view'),
	viewWidth = 1000,
	viewHeight = 800,
	scale = window.devicePixelRatio,
	app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x000000, resolution: window.devicePixelRatio } );

const Config = require( './inc/config.js' )( PIXI, app );

window.app = app;
view.style.width = viewWidth + 'px';
view.style.height = viewHeight + 'px';

loader
	.add( "assets/spritesheets/ships.json" )
	.load( setup );

window.gameModels = [];
window.current = {
	direction: 145,
	force: .3
}

window.friction = 0.98;

var oceanFloor = PIXI.extras.TilingSprite.fromImage(
	"assets/images/boxes-blue-red.png",
	// "assets/images/tile-1px-black.png",
	// "assets/images/sand.png",
	viewWidth,
	viewHeight
);
oceanFloor.x = viewWidth / 2;
oceanFloor.y = viewHeight / 2;
oceanFloor.anchor.set( 0.5 );
app.stage.addChild( oceanFloor );

let waterManager = WaterManager( {
	uResolution: { type: 'v2', value: [ viewWidth, viewHeight ] },
} ).init();

// oceanFloor.filters = [ waterManager.shader.shader ];

// let graphics = new PIXI.Graphics();
// window.graphics = graphics;
// // set a fill and line style
// graphics.beginFill(0xFF3300);
// graphics.lineStyle(4, 0xffd900, 1);

// // draw a shape
// graphics.moveTo(50,50);
// graphics.lineTo(250, 50);
// graphics.lineTo(100, 100);
// graphics.lineTo(50, 50);
// graphics.endFill();

// app.stage.addChild( graphics );

function setup() {
	var id = PIXI.loader.resources[ Config.spriteSheetPath + "ships.json" ].textures;
	gameModels = loadGameModels();
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
	waterManager.update( delta );

	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		gameModels[ i ].base.update( delta, {
			velocities: [ {
				x: window.current.force * math.cos( math.unit( window.current.direction, 'deg' ) ),
				y: window.current.force * math.sin( math.unit( window.current.direction, 'deg' ) )
			} ],
			frictions: [ window.friction ]
		} );
	}

	if ( turtle.sprite.getBounds().x < 0 ) {
		console.log( 'left' );
		turtle.currentPosition.x = Math.ceil( turtle.sprite.getBounds().width / 2 ) + 1;
	}
	
	if ( turtle.sprite.getBounds().x + turtle.sprite.getBounds().width > app.view.offsetWidth ) {
		console.log( 'right' );
		turtle.currentPosition.x = app.view.offsetWidth - Math.ceil( turtle.sprite.getBounds().width / 2 );
	}
	
	if ( turtle.sprite.getBounds().y < 0 ) {
		console.log( 'top' );
		turtle.currentPosition.y = Math.ceil( turtle.sprite.getBounds().height / 2 );
	}

	if ( turtle.sprite.getBounds().y + turtle.sprite.getBounds().height > app.view.offsetHeight ) {
		console.log( 'bottom' );
		turtle.currentPosition.y = app.view.offsetHeight - Math.ceil( turtle.sprite.getBounds().height / 2 );
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
