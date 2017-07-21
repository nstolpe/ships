'use strict'

const Util = require( './inc/util.js' );
const math = require( 'mathjs' );
const PIXI = require( 'pixi.js' );
const Sprite = PIXI.Sprite;
const loader = PIXI.loader;
const view = document.getElementById('view');
const viewWidth = 1000;
const viewHeight = 800;
const scale = window.devicePixelRatio;
const app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x000000 } );

const graphics = new PIXI.Graphics();

let circle = {
	color: 0xe74c3c,
	position: { x: 400, y: 400 },
	radius: 50,
	draw() {
		graphics.clear();
		graphics.beginFill( this.color );
		graphics.drawCircle( this.position.x, this.position.y, this.radius );
		graphics.endFill();
	},
	update( props ) {
		this.color = props.color || this.color;
		this.position = props.position || this.position;
		this.radius = props.radius || this.radius;
	}
}

function setup() {
	app.stage.addChild( graphics );
	app.ticker.add( animate );
}

let sign = 1;

function animate( delta ) {
	if ( circle.radius >= 200 )
		sign = -1;
	else if ( circle.radius <= 50 )
		sign = 1;

	circle.update( {
		radius: circle.radius + ( sign * delta ),
		position: { x: circle.position.x, y: circle.position.y + delta * .5 }
	} );
	circle.draw();
}



loader
	.add( "assets/spritesheets/ships.json" )
	.load( setup );
