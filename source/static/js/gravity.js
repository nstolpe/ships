const math = require( 'mathjs' );
const PIXI = require( 'pixi.js' );

//{INCLUDES}
const Util = require( './inc/util.js' );
const GameModels = require( './inc/game-models.js' );
//{/INCLUDES}

console.log( 'Loading gravity simulation' );

const view = document.getElementById('view');
const viewWidth = 400;
const viewHeight = 400;
const scale = window.devicePixelRatio;
const app = new PIXI.Application( viewWidth * scale, viewHeight * scale, { view: view, backgroundColor : 0x000000 } );

const loader = PIXI.loader;
const imagePath = '../assets/images/';
const config  = [
	{
		id: 'turtle-rudder.png',
		currentPosition: { x: 20, y: 20 },
		name: 'rudder'
	}
];

const gameModels = [];

window.math = math;
window.gameModels = gameModels;
window.app = app;

for ( let i = 0, l = config.length; i < l; i++ ) {
	loader.add( imagePath + config[ i ].id );
}

loader.load( setup );

function setup() {
	let dropTime  = 0;

	for ( let i = 0, l = config.length; i < l; i++ ) {
		gameModels[ i ] = GameModels.TransformableGroup( {
			sprite: PIXI.Sprite.fromImage( imagePath + config[ i ].id ),
			currentPosition: config[ i ].currentPosition,
			maxEngineVelocity: Infinity
		} );
	}

	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		app.stage.addChild( gameModels[ i ].sprite );
	}

	function update( delta ) {
		dropTime += delta;
		for ( let i = 0, l = gameModels.length; i < l; i++ ) {
			// gameModels[ i ].currentPosition.y += 0.005 * Settings.gravity * dropTime;
			gameModels[ i ].engineVelocity -= 0.005 * Settings.gravity * delta;
			// gameModels[ i ].currentPosition.y += delta;
			console.log( delta );
			gameModels[ i ].update( delta );
			if ( gameModels[ i ].currentPosition.y >= app.view.height - gameModels[ i ].sprite.height ) {
				gameModels[ i ].currentPosition.y = app.view.height - gameModels[ i ].sprite.height;
				gameModels[ i ].engineVelocity = 0;
				gameModels[ i ].update( 0 );
				app.ticker.remove( update );
			}
		}
	}
	update( 0 );
	app.ticker.add( update );
}

const Settings = {
	gravity: parseFloat( document.getElementById( 'gravity-select' ).value, 10 )
}

const Input = function() {
	let input = {
		gravitySelect: document.getElementById( 'gravity-select' ),
		velocityInput: document.getElementById( 'velocity-input' ),
		init() {
			this.bindHandlers();
			return this;
		},
		bindHandlers() {
			this.gravitySelect.onchange = ( e ) => {
				Settings.gravity = e.target.value;
			};
			this.velocityInput.oninput = ( e ) => {
				Settings.velocity = e.target.value
			};
		}
	}

	return input;
}

let input = Input().init();
