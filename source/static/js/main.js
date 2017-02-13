'use strict'

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
	Helper = {
		toDegrees( angle ) {
			return angle * ( 180 / Math.PI );
		},
		toRadians( angle ) {
			return angle * ( Math.PI / 180 );
		}
	},
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

function setup() {
	var id = PIXI.loader.resources["../assets/spritesheets/ships.json"].textures;
	window.turtle = Models.turtle();
	turtle.position = { x: viewWidth * scale / 2, y: viewHeight * scale / 2 };
	app.stage.addChild( turtle.root );
	setupInput();
	app.ticker.add( animate );
}

function animate( delta ) {
	turtle.update( delta ); 
	turtle.root.position.set( turtle.position.x, turtle.position.y );
	turtle.root.rotation = turtle.rotation;
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
		cannonForeRight.rotation = Helper.toRadians( -23 );
		cannonForeRight.x = 75;
		cannonForeRight.y = 27;

		cannonAftRight.pivot.y = cannonAftRight.height / 2
		cannonAftRight.rotation = Helper.toRadians( 23 );
		cannonAftRight.x = 75;
		cannonAftRight.y = 93;

		cannonMidLeft.pivot.y = cannonMidRight.height / 2;
		cannonMidLeft.rotation = Helper.toRadians( 180 );
		cannonMidLeft.x = cannonMidLeft.width;
		cannonMidLeft.y = 59;

		cannonForeLeft.pivot.y = cannonForeRight.height / 2
		cannonForeLeft.rotation = Helper.toRadians( -157 );
		cannonForeLeft.x = 41; // width of cannonMidLeft + 4 (diff of cannonMidRight.x and cannon)
		cannonForeLeft.y = 27;

		cannonAftLeft.pivot.y = cannonAftRight.height / 2
		cannonAftLeft.rotation = Helper.toRadians( 157 );
		cannonAftLeft.x = 41;
		cannonAftLeft.y = 93;
		
		rudder.x = root.width / 2 - rudder.width / 2;
		rudder.y = 110;

		root.pivot.x = root.width / 2;
		root.pivot.y = root.height / 2;

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
			positionAcceleration: ternaryState.EQUAL,
			velocity: {
				x: 0,
				y: 0
			},
			rotation: 0,
			rotationVelocity: 0,
			maxRotationVelocity: 1,
			rotationVelocityIncrement: .001,
			rotationAcceleration: ternaryState.EQUAL,
			updatePositionVelocity( delta, limit, reverse ) {
				if ( reverse )
					this.positionVelocity = Math.max( this.positionVelocity - ( delta * this.positionVelocityIncrement ), limit );
				else
					this.positionVelocity = Math.min( this.positionVelocity + ( delta * this.positionVelocityIncrement ), limit );
			},
			updateRotationVelocity( delta, limit, reverse ) {
				if ( reverse )
					this.rotationVelocity = Math.max( this.rotationVelocity - ( delta * this.rotationVelocityIncrement ), limit );
				else
					this.rotationVelocity = Math.min( this.rotationVelocity + ( delta * this.rotationVelocityIncrement ), limit );
			},
			update( delta ) {
				switch ( this.rotationAcceleration ) {
					case ternaryState.MINUS:
						this.updateRotationVelocity( delta, -this.maxRotationVelocity, true );
						break;
					case ternaryState.PLUS:
						this.updateRotationVelocity( delta, this.maxRotationVelocity, false );
						break;
					case ternaryState.EQUAL:
					default:
						if ( this.rotationVelocity !== 0 ) {
							this.updateRotationVelocity( delta, 0, this.rotationVelocity > 0 );
						}
						break;
				}

				this.rotation += this.rotationVelocity * delta;

				switch ( this.positionAcceleration ) {
					case ternaryState.MINUS:
						this.updatePositionVelocity( delta, -this.maxPositionVelocity, true );
						break;
					case ternaryState.PLUS:
						this.updatePositionVelocity( delta, this.maxPositionVelocity, false );
						break;
					case ternaryState.EQUAL:
					default:
						if ( this.positionVelocity !== 0 ) {
							this.updatePositionVelocity( delta, 0, this.positionVelocity > 0 );
						}
						break;
				}
				console.log( this.positionVelocity );
				let vx = this.positionVelocity * Math.cos( this.rotation ),
					vy = this.positionVelocity * Math.sin( this.rotation );

				this.position.x += vx * delta;
				this.position.y += vy * delta;
			}
		}
	}
}

function setupInput() {
	let W = keyboard( 87 ),
		A = keyboard( 65 ),
		S = keyboard( 83 ),
		D = keyboard( 68 );

	W.press = () => {
		console.log( 'press w' );
		turtle.positionAcceleration = ternaryState.PLUS;
	}
	W.release = () => {
		console.log( 'release w' );
		if ( !S.isDown )
			turtle.positionAcceleration = ternaryState.EQUAL;
	}

	S.press = () => {
		console.log( 'press s' );
		turtle.positionAcceleration = ternaryState.MINUS;
	}
	S.release = () => {
		console.log( 'release s' );
		if ( !W.isDown )
			turtle.positionAcceleration = ternaryState.EQUAL;
	}

	A.press = () => {
		console.log( 'A press');
		turtle.rotationAcceleration = ternaryState.MINUS;
	}
	A.release = () => {
		console.log( 'A release');
		if ( !D.isDown )
			turtle.rotationAcceleration = ternaryState.EQUAL;
	}

	D.press = () => {
		console.log( 'D press');
		turtle.rotationAcceleration = ternaryState.PLUS;
	}
	D.release = () => {
		console.log( 'D release');
		if ( !A.isDown )
			turtle.rotationAcceleration = ternaryState.EQUAL;
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
