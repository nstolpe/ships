'use strict'

const Util = require( './inc/util.js' );
const math = require( 'mathjs' );
const Vec = require( 'victor' );
const PIXI = require( 'pixi.js' );
const Sprite = PIXI.Sprite;
const loader = PIXI.loader;
const view = document.getElementById('view');
const viewWidth = 1000;
const viewHeight = 800;
const scale = window.devicePixelRatio;
const app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x000000 } );

const graphics = new PIXI.Graphics();

function Circle( props ) {
	return {
		color: props.color || 0x000000,
		position: Vec.prototype.isPrototypeOf( props.position ) ? props.position : Array.isArray( props.position ) ? Vec.fromArray( props.position ) : Vec( 0, 0 ),
		radius: isNaN( props.radius ) ? 50 : props.radius,
		mass: isNaN( props.mass ) ? 0 : props.mass,
		velocity: Vec( 0, 0 ),
		draw() {
			graphics.beginFill( this.color );
			graphics.drawCircle( this.position.x, this.position.y, this.radius );
			graphics.endFill();
		},
		update( props ) {
			this.color = props.color || this.color;
			this.position = Vec.prototype.isPrototypeOf( props.position ) ? props.position : Array.isArray( props.position ) ? Vec.fromArray( props.position ) : this.position,
			this.radius = isNaN( props.radius ) ? this.radius : props.radius;
			this.mass = isNaN( props.mass ) ? this.mass : props.mass;
			this.velocity = props.velocity || this.velocity;
		},
		forces: props.forces || []
	}
}

let circles = [
	Circle( {
		color: 0x01f34f,
		position: [ 200, 200 ],
		mass: 5,
		radius: 50
	} ),
	Circle( {
		color: 0x00c3f1,
		position: [ 600, 230 ],
		mass: 3,
		radius: 30
	} ),
	Circle( {
		color: 0x00c3f1,
		position: [ 500, 400 ],
		mass: 0.2,
		radius: 20
	} ),
	Circle( {
		color: 0xff0000,
		position: [ 20, 20 ],
		mass: .01,
		radius: 5
	} ),
	Circle( {
		color: 0xcc143f,
		position: [ 100, 200 ],
		mass: .5,
		radius: 16,
		forces: [
			{
				name: 'flux',
				magnitude: .2,
				direction: Vec( 0, 0 ),
				mass: true
			}
		]
	} ),
];

/**
 * Ties an oscillator to an object and binds its frequency
 * to the object's position.
 */
function OscillatorManager( source ) {
	let audioCtx = new window.AudioContext();
	// create Oscillator node
	let oscillator = audioCtx.createOscillator();

	oscillator.type = 'sine';
	oscillator.frequency.value = 200; // value in hertz
	oscillator.connect( audioCtx.destination );

	return {
		source: source,
		oscillator: oscillator,
		start() {
			oscillator.start();
		},
		stop() {
			oscillator.stop();
		},
		update() {
			oscillator.frequency.value = source.position.y;
		}
	};
}

let sign = 1;
let oscillatorManager;

function setup() {
	app.stage.addChild( graphics );
	app.ticker.add( animate );
	oscillatorManager = OscillatorManager( circles[ 4 ] );
	// oscillatorManager.start();
}

let forces = [
	{
		name: 'gravity',
		magnitude: .1,
		direction: Vec( 0, 1 ),
		mass: false
	},
	{
		name: 'west wind',
		magnitude: .001,
		direction: Vec( 1, 0 ),
		mass: true
	}
];

function animate( delta ) {
	graphics.clear();

	circles.forEach( ( circle, i ) => {
		let allForces = forces.concat( circle.forces );
		let accumulatedForces = Vec( 0, 0 );

		for ( let i = 0, l = allForces.length; i < l; i++ ) {
			let force = allForces[ i ];
			let v = force.direction.clone().multiplyScalar( force.magnitude * delta / 2 );
			if ( force.mass )
				v.divideScalar( circle.mass );
			accumulatedForces.add( v );
		}

		let velocity = circle.velocity.clone().add( accumulatedForces );
		let position = circle.position.clone().add( velocity.clone().multiplyScalar( delta ) );
		velocity.add( accumulatedForces );

		circle.update( {
			velocity: velocity,
			position: position
		} );

		floatCircle( circle, i, 4, 200, 300 );
		circle.draw();
	} );

	// oscillatorManager.update();
}

function floatCircle( target, idx, targetIdx, low, high ) {
	if ( idx === targetIdx ) {
		if ( target.position.y > low ) {
			target.forces[ 0 ].direction.y = -1;
		} else if ( target.position.y < high ) {
			target.forces[ 0 ].direction.y = 0;
		}
	}
}

loader
	.add( "assets/spritesheets/ships.json" )
	.load( setup );
