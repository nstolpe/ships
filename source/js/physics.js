'use strict'

const math = require( 'mathjs' );
const PIXI = require( 'pixi.js' );
const Util = require( './inc/util.js' );
const Vec2 = require( './inc/vector2.js');
const Shapes = require( './inc/shapes.js' );
const Sprite = PIXI.Sprite;
const loader = PIXI.loader;
const view = document.getElementById('view');
const viewWidth = 1000;
const viewHeight = 800;
const scale = window.devicePixelRatio;
const app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x000000 } );

const graphics = new PIXI.Graphics();

const GraphicsManager = {
	graphics: new PIXI.Graphics(),
	shapes: [],
	draw() {
		this.graphics.clear();
		for ( let i = 0, l = this.shapes.length; i < l; i ++ ) {
			let shape = this.shapes[ i ];
			this.graphics.beginFill( shape.color );
			this.graphics[ shape.drawMethod ].apply( this.graphics, shape.drawArgs() );
			this.graphics.endFill();
		}
	}
}

let circles = [
	Shapes.Circle( {
		color: 0x01f34f,
		position: [ 200, 200 ],
		mass: 5,
		radius: 50
	} ),
	Shapes.Circle( {
		color: 0x00c3f1,
		position: [ 600, 230 ],
		mass: 3,
		radius: 30
	} ),
	Shapes.Circle( {
		color: 0x00c3f1,
		position: [ 500, 400 ],
		mass: 0.2,
		radius: 20
	} ),
	Shapes.Circle( {
		color: 0xff0000,
		position: [ 20, 20 ],
		mass: .01,
		radius: 5
	} ),
	Shapes.Circle( {
		color: 0xcc143f,
		position: [ 200, 400 ],
		mass: 10,
		radius: 16,
		forces: [
			{
				name: 'anti-gravity',
				magnitude: .2,
				direction: Vec2( 0, 0 ),
				mass: false
			},
			{
				name: 'east-wind',
				magnitude: .002,
				direction: Vec2( 0, 0 ),
				mass: true
			}
		],
		postUpdates: [
			function( delta ) {
				let ag = this.forces.find( ( f ) => f.name === 'anti-gravity' );
				if ( ag ) {
					if ( this.position.y > 400 )
						ag.direction.y = -1;
					if ( this.position.y < 425 )
						ag.direction.y = 0;
				}
				let ew = this.forces.find( ( f ) => f.name === 'east-wind' );
				if ( ew ) {
					if ( this.position.x > 400 )
						ew.direction.x = -1;
					if ( this.position.x < 200 )
						ew.direction.x = 0;
				}
			}
		]
	} ),
];

GraphicsManager.shapes.push.apply( GraphicsManager.shapes, circles );
let rectangles = [
	// Shapes.Rectangle( {
	// 	color: 0xffffff,
	// 	position: [ 100, 800 ],
	// 	dimensions: [ 400, 80 ],
	// 	mass: 100,
	// 	static: true
	// } );
]
/**
 * Ties an oscillator to an object and binds its frequency
 * to the object's position.
 */
function OscillatorManager( source ) {
	let audioCtx = new window.AudioContext();
	// create Oscillator node
	let oscillator = audioCtx.createOscillator();

	oscillator.type = 'sawtooth';
	oscillator.frequency.value = 200; // value in hertz
	oscillator.connect( audioCtx.destination );

	return {
		source: source,
		oscillator: oscillator,
		start() {
			this.oscillator.start();
		},
		stop() {
			this.oscillator.stop();
		},
		update() {
			this.oscillator.frequency.value = Math.sqrt( Math.pow( source.velocity.x, 2 ) + Math.pow( source.velocity.y, 2 ) ) * 10;
		}
	};
}

let sign = 1;
let oscillatorManager;

function setup() {
	app.stage.addChild( GraphicsManager.graphics );
	app.ticker.add( animate );
	oscillatorManager = OscillatorManager( circles[ 4 ] );
	// oscillatorManager.start();
}

let forces = [
	{
		name: 'gravity',
		magnitude: .1,
		direction: Vec2( 0, 1 ),
		mass: false
	},
	{
		name: 'west wind',
		magnitude: .001,
		direction: Vec2( 1, 0 ),
		mass: true
	}
];

function animate( delta ) {
	graphics.clear();

	circles.forEach( ( circle, idx ) => {
		let allForces = forces.concat( circle.forces );
		let accumulatedForces = accumulateForces( circle, app.ticker.elapsedMS / 10 );
		let velocity = circle.velocity.copy().add( accumulatedForces );
		let position = circle.position.copy().add( velocity.copy().mul( app.ticker.elapsedMS / 10 ) );
		velocity.add( accumulatedForces );

		circle.update( {
			velocity: velocity,
			position: position
		}, app.ticker.elapsedMS / 10 );
	} );

	GraphicsManager.draw();
	// oscillatorManager.update();
}

function updateVelocity( body, delta ) {

}
/**
 * Adds all environmental forces and object specific forces to an object.
 */
function accumulateForces( body, delta ) {
	let allForces = forces.concat( body.forces );
	let accumulated = Vec2( 0, 0 );

	for ( let i = 0, l = allForces.length; i < l; i++ ) {
		let force = allForces[ i ];

		let v = force.direction.copy().nor().mul( force.magnitude * delta / 2 );

		// divide by mass if this force is influenced by mass (gravity isn't)
		if ( force.mass )
			v.mul( 1 / body.mass );

		accumulated.add( v );
	}

	return accumulated;
}

loader
	.add( "assets/spritesheets/ships.json" )
	.load( setup );
