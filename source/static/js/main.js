'use strict'
const Config = require( './config.js' );
const Util = require( './util.js' );
const GameModels = require( './game-models.js' );

const PIXI = require( 'pixi.js' ),
	TextureCache = PIXI.utils.TextureCache,
	Sprite = PIXI.Sprite,
	Container = PIXI.Container,
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
	window.turtle = Models.turtle();
	gameModels = loadGameModels();
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		app.stage.addChild( gameModels[ i ].base.element );
	}
	turtle.position = { x: viewWidth * scale / 2, y: viewHeight * scale / 2 };
	app.stage.addChild( turtle.root );
	setupInput();
	app.ticker.add( animate );
}

function animate( delta ) {
	turtle.update( delta ); 
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
		let tr = GameModels.TransformableRenderable( Object.assign( { element: sprite }, child.options ) );

		base.addChild( child.name, tr, child.init );
	}

	base.update( 0 );
	model.init( base );
	return { base: base }
}

const Models = {
	turtle() {
		const root = new Container(),
			id = PIXI.loader.resources["../assets/spritesheets/ships.json"].textures,
			body = new Sprite( id[ "turtle-body.png" ] ),
			rudder = new Sprite( id[ "turtle-rudder.png" ] ),
			cannonForeRight = new Sprite( id[ "turtle-cannon-small.png" ] ),
			cannonMidRight = new Sprite( id[ "turtle-cannon-large.png" ] ),
			cannonAftRight = new Sprite( id[ "turtle-cannon-small.png" ] ),
			cannonForeLeft = new Sprite( id[ "turtle-cannon-small.png" ] ),
			cannonMidLeft = new Sprite( id[ "turtle-cannon-large.png" ] ),
			cannonAftLeft = new Sprite( id[ "turtle-cannon-small.png" ] );
		
		const TernaryState = Object.freeze( {
			MINUS: -1,
			EQUAL: 0,
			PLUS: 1
		} );

		body.x = 15;

		root.addChild( rudder );
		root.addChild( cannonForeRight );
		root.addChild( cannonMidRight );
		root.addChild( cannonAftRight );
		root.addChild( cannonForeLeft );
		root.addChild( cannonMidLeft );
		root.addChild( cannonAftLeft );
		root.addChild( body );

		cannonMidRight.pivot.y = cannonMidRight.height / 2;
		cannonMidRight.x = 79;
		cannonMidRight.y = 59;

		cannonForeRight.pivot.y = cannonForeRight.height / 2
		cannonForeRight.rotation = Util.toRadians( -23 );
		cannonForeRight.x = 75;
		cannonForeRight.y = 27;

		cannonAftRight.pivot.y = cannonAftRight.height / 2
		cannonAftRight.rotation = Util.toRadians( 23 );
		cannonAftRight.x = 75;
		cannonAftRight.y = 93;

		cannonMidLeft.pivot.y = cannonMidRight.height / 2;
		cannonMidLeft.rotation = Util.toRadians( 180 );
		cannonMidLeft.x = cannonMidLeft.width;
		cannonMidLeft.y = 59;

		cannonForeLeft.pivot.y = cannonForeRight.height / 2
		cannonForeLeft.rotation = Util.toRadians( -157 );
		cannonForeLeft.x = 41; // width of cannonMidLeft + 4 (diff of cannonMidRight.x and cannon)
		cannonForeLeft.y = 27;

		cannonAftLeft.pivot.y = cannonAftRight.height / 2
		cannonAftLeft.rotation = Util.toRadians( 157 );
		cannonAftLeft.x = 41;
		cannonAftLeft.y = 93;
		
		rudder.x = root.width / 2 - rudder.width / 2;
		rudder.y = 110;

		root.pivot.x = root.width / 2;
		root.pivot.y = body.height;

		root.scale.set( .75, .75 );

		return {
			root: root,
			body: body,
			rudder: rudder,
			cannonForeRight: cannonForeRight,
			cannonMidRight: cannonMidRight,
			cannonAftRight: cannonAftRight,
			cannonForeLeft: cannonForeLeft,
			cannonMidLeft: cannonMidLeft,
			cannonAftLeft: cannonAftLeft,
			position: {
				x: 0,
				y: 0
			},
			positionVelocity: 0,
			maxPositionVelocity: 2,
			positionVelocityIncrement: .01,
			positionAcceleration: TernaryState.EQUAL,
			velocity: {
				x: 0,
				y: 0
			},
			rotation: 0,
			rotationVelocity: 0,
			maxRotationVelocity: 0.02,
			rotationVelocityIncrement: 0.001,
			rotationAcceleration: TernaryState.EQUAL,
			aimLeftCannons( delta ) {

			},
			// @TODO Fix this.
			updateRotationVelocity( delta, acceleration, velocity, increment, limit ) {
				let target;

				if ( acceleration !== TernaryState.EQUAL ) {
					target = velocity + ( delta * increment * acceleration );
					return Math.min( Math.abs( target ), limit ) * acceleration
				} else {
					// velocity is returning to 0
					if ( velocity > 0 ) {
						target = velocity + ( delta * increment );
						return Math.max( target , 0 );
					}
					if ( velocity < 0 ) {
						target = velocity + ( delta * increment ); 
						return Math.min( target, 0 );
					}
					return velocity;
				}
			},
			calculateVelocity( delta, acceleration, velocity, increment, limit ) {
				let calculated = velocity;
				switch ( acceleration ) {
					case TernaryState.MINUS:
						calculated = Math.max( velocity - ( delta * increment ), -limit );
						break;
					case TernaryState.PLUS:
						calculated = Math.min( velocity + ( delta * increment ), limit );
						break;
					case TernaryState.EQUAL:
					default:
						if ( velocity > 0 ) {
							calculated = Math.max( velocity - ( delta * increment ), 0 );
						} else if ( velocity < 0 ) {
							calculated = Math.min( velocity + ( delta * increment ), limit );

						} else {
							calculated = velocity;
						}
						break;
				}

				return calculated;
			},
			update( delta ) {
				this.rotationVelocity = this.calculateVelocity(
						delta,
						this.rotationAcceleration,
						this.rotationVelocity,
						this.rotationVelocityIncrement,
						this.maxRotationVelocity
					);
				this.rotation = this.normalizeAngle( this.rotation + this.rotationVelocity * delta);

				rudder.rotation = -this.rotationVelocity * 10;

				this.positionVelocity = this.calculateVelocity(
						delta,
						this.positionAcceleration,
						this.positionVelocity,
						this.positionVelocityIncrement,
						this.maxPositionVelocity
					);

				let vx = this.positionVelocity * Math.sin( this.rotation ),
					vy = -this.positionVelocity * Math.cos( this.rotation );

				this.position.x += vx * delta;
				this.position.y += vy * delta;

				this.root.position.set( this.position.x, this.position.y );
				this.root.rotation = this.rotation;
			},
			normalizeAngle( angle ) {
				const limit = 2 * Math.PI;
				let normalized = angle;
				if ( angle >= limit )
					normalized -= limit * Math.floor( normalized / limit );
				else if ( angle <= -limit )
					normalized += limit * Math.floor( normalized / -limit );

				return normalized;
			},
		}
	}
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
	}
	W.release = () => {
		if ( !S.isDown )
			turtle.positionAcceleration = ternaryState.EQUAL;
	}

	S.press = () => {
		turtle.positionAcceleration = ternaryState.MINUS;
	}
	S.release = () => {
		if ( !W.isDown )
			turtle.positionAcceleration = ternaryState.EQUAL;
	}

	A.press = () => {
		turtle.rotationAcceleration = ternaryState.MINUS;
	}
	A.release = () => {
		if ( !D.isDown )
			turtle.rotationAcceleration = ternaryState.EQUAL;
	}

	D.press = () => {
		turtle.rotationAcceleration = ternaryState.PLUS;
	}
	D.release = () => {
		if ( !A.isDown )
			turtle.rotationAcceleration = ternaryState.EQUAL;
	}

	H.press = () => {
		turtle.cannonMidLeft.rotation += .1;
	}
	H.release = () => {
		// if ( !A.isDown )
		// 	turtle.rotationAcceleration = ternaryState.EQUAL;
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
