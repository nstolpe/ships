'use strict'

const Util = require( './inc/util.js' );
const SteeringKeyboard = require( './inc/steering-keyboard.js' );
const GameModels = require( './inc/game-models.js' );
const EmitterManager = require( './inc/emitter-manager.js' );
const CollisionPolygon = require( './inc/collision-polygon.js' );
const Vec2 = require( './inc/vector2.js');

window.math = require( 'mathjs' );
const PIXI = require( 'pixi.js' );
const Sprite = PIXI.Sprite;
const loader = PIXI.loader;
const view = document.getElementById('view');
const scale = window.devicePixelRatio;
const viewWidth = document.body.offsetWidth;
const viewHeight = document.body.offsetHeight;
const app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x051224, resolution: scale, autoResize: true } );
const Particles = require( 'pixi-particles' );

const Config = require( './inc/config.js' )( PIXI, app );

let graphics;

window.app = app;
view.style.width = viewWidth + 'px';
view.style.height = viewHeight + 'px';

loader
	.add( 'assets/spritesheets/ships.json' )
	.add( 'emitter', 'assets/data/emitter.json' )
	.add( 'particle', 'assets/images/pixel.png' )
	.add( 'boards', 'assets/images/boards.png' )
	.load( setup );

window.gameModels = [];
window.current = {
	direction: 145,
	force: .05
};

window.friction = 0.98;

let emitterManager;
let emitterParent = new PIXI.Container();
let stageGraphics = new PIXI.Graphics();


function setup( loader, resources ) {
	emitterParent.width = viewWidth;
	emitterParent.height = viewHeight;
	app.stage.addChild( emitterParent );
	emitterManager = EmitterManager(
		resources.emitter.data,
		emitterParent,
		[ resources['particle'].texture ],
		{ w: viewWidth, h: viewHeight },
		17,
		current.direction
	);
	emitterManager.start();

	gameModels = loadGameModels();
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		app.stage.addChild( gameModels[ i ].base.sprite );
	}
	app.stage.addChild( stageGraphics );

	window.turtle = gameModels[ 0 ].base;
	turtle.sprite.width *= .5;
	turtle.sprite.height *= .5;
	SteeringKeyboard();

	app.ticker.add( animate );
}

function animate( delta ) {
	stageGraphics.clear();

	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		let model = gameModels[ i ];

		model.base.update( delta, {
			velocities: [ {
				x: window.current.force * math.cos( math.unit( window.current.direction, 'deg' ) ),
				y: window.current.force * math.sin( math.unit( window.current.direction, 'deg' ) )
			} ],
			frictions: [ window.friction ]
		} );

		if ( model.base.debug )
			drawDebug( model );
	}

	// check collision between every game model. very inneficient.
	// for ( let i = 0, l = gameModels.length; i < l; i++ ) {
	// 	for ( let ii = 0, ll = gameModels.length; ii < ll; ii++ ) {
	// 		if ( i !== ii ) checkCollision( gameModels[ i ], gameModels[ ii ] );
	// 	}
	// }
	let t = gameModels.find((v) => v.base.name === 'turtle');
	for ( let i = 0, l = gameModels.length; i < l; i++ ) {
		if ( gameModels[ i ] !== t ) checkCollision( t, gameModels[ i ] );
	}

	emitterManager.update( delta, [ current ] );

	// check if the turtle is leaving the screen bounds
	// @TODO use better collision detection
	// checkScreenBounds( turtle, { left: 0, right: app.view.offsetWidth, top: 0, bottom: app.view.offsetHeight } );
}

function checkCollision( one, two ) {
	let positionOne = one.base.currentPosition;
	let positionTwo = two.base.currentPosition;
	let lengthOne = one.base.sprite.hitArea.points.length;
	let lengthTwo = two.base.sprite.hitArea.points.length;
	let pointsOne = [];
	let pointsTwo = [];
	let p;

	// make arrays of the incoming points.
	for ( let i = 0, l = lengthOne + lengthTwo; i < l; i += 2 ) {
		if ( i < lengthOne ) {
			p = one.base.sprite.transform.localTransform.apply( {
				x: one.base.sprite.hitArea.points[ i ],
				y: one.base.sprite.hitArea.points[ i + 1 ]
			} );
			pointsOne.push( p );
		} else {
			p = two.base.sprite.transform.localTransform.apply( {
				x: two.base.sprite.hitArea.points[ Math.floor( i - lengthOne ) ],
				y: two.base.sprite.hitArea.points[ Math.floor( i - lengthOne ) + 1 ]
			} );
			pointsTwo.push( p );
		}
	}

	for ( let i = 0, l = pointsOne.length; i < l; i++ ) {
		let normal = {
			x: one.base.sprite.hitArea.normals[ i * 2 ],
			y: one.base.sprite.hitArea.normals[ i * 2 + 1 ]
		};

		let separating = separatingAxis( positionOne, positionTwo, pointsOne, pointsTwo, normal, { one: one.base.name, two: two.base.name } );
	}
	// console.log( one2 );
	// console.log( two2 );
}

function separatingAxis( positionOne, positionTwo, pointsOne, pointsTwo, normal, names ) {
	let rangeOne = projectPoints( pointsOne, normal );
	let rangeTwo = projectPoints( pointsTwo, normal );
	let offsetVec = {
		x: positionTwo.x - positionOne.x,
		y: positionTwo.y - positionOne.y
	};

	let offsetDot = offsetVec.x * normal.x + offsetVec.y * normal.y

	rangeTwo.min += offsetDot;
	rangeTwo.max += offsetDot;

	if ( rangeOne.min > rangeTwo.max || rangeTwo.min > rangeOne.max ) {
		// window.dispatchEvent( new CustomEvent('message', {
		// 	detail: {
		// 		type: 'update-collision',
		// 		names: `${ names.one } ${ names.two }`
		// 	}
		// } ) );
		return true;
	}

	return false;
}

function projectPoints( points, normal ) {
	let min = Number.MAX_VALUE;
	let max = -Number.MAX_VALUE;

	for ( let i = 0, l = points.length; i < l; i++ ) {
		let point = points[ i ];
		let dot = point.x * normal.x + point.y * normal.y;
		min = dot < min ? dot : min;
		max = dot > max ? dot : max;
	}
	return { min: min, max: max } ;
}
function drawDebug( model ) {
	// draw the hitarea if it has it. only works for collision polygons.
	if ( model.base.sprite.hitArea ) {
		stageGraphics.lineStyle( 1, 0xf1ff32, 1 );

		let p = Vec2(
			model.base.sprite.hitArea.points[ 0 ] - model.base.pivot.x,
			model.base.sprite.hitArea.points[ 1 ] - model.base.pivot.y
		).scale( model.base.sprite.scale )
		.rotate( model.base.sprite.rotation )
		.add( model.base.currentPosition );

		stageGraphics.moveTo( p.x, p.y );

		for ( let i = 2, l = model.base.sprite.hitArea.points.length; i < l; i += 2 ) {
			p.set(
				model.base.sprite.hitArea.points[ i ] - model.base.pivot.x,
				model.base.sprite.hitArea.points[ i + 1 ] - model.base.pivot.y
			).scale( model.base.sprite.scale )
			.rotate( model.base.sprite.rotation )
			.add( model.base.currentPosition );

			stageGraphics.lineTo( p.x, p.y );
		}

		p.set(
			model.base.sprite.hitArea.points[ 0 ] - model.base.pivot.x,
			model.base.sprite.hitArea.points[ 1 ] - model.base.pivot.y
		).scale( model.base.sprite.scale )
		.rotate( model.base.sprite.rotation )
		.add( model.base.currentPosition );

		stageGraphics.lineTo( p.x, p.y );

		// start: draw normal lines
		for ( let i = 0, l = model.base.sprite.hitArea.points.length; i < l; i += 2 ) {
			// get the point on the face half way down the edge
			let halfEdge = Vec2(
				model.base.sprite.hitArea.points[ i ] + ( model.base.sprite.hitArea.edges[ i ] / 2 ),
				model.base.sprite.hitArea.points[ i + 1 ] + ( model.base.sprite.hitArea.edges[ i + 1 ] / 2 )
			);

			// get the endpoint for the normal line.
			let end = halfEdge.copy().add(
					model.base.sprite.hitArea.normals[ i ] * 10,
					model.base.sprite.hitArea.normals[ i + 1 ] * 10
				)
				.sub( model.base.pivot )
				.scale( model.base.sprite.scale )
				.rotate( model.base.sprite.rotation )
				.add( model.base.currentPosition );

			// apply the sprite's transform to the halfEdge point to get the start of the normal line.
			p.set( halfEdge )
				.sub( model.base.pivot )
				.scale( model.base.sprite.scale )
				.rotate( model.base.sprite.rotation )
				.add( model.base.currentPosition );

			// start a line at the half-way point.
			stageGraphics.moveTo( p.x, p.y );
			// draw a line to the half-way point rotated by the normal * 10
			stageGraphics.lineTo( end.x, end.y );
		}
		// end: draw normal lines
	}

	// draw the AABB for the sprite.
	let bounds = model.base.sprite.getBounds();

	stageGraphics.lineStyle( 1, 0xff4cc7, 1 );
	stageGraphics.moveTo( bounds.x, bounds.y );
	stageGraphics.lineTo( bounds.x, bounds.y + bounds.height );
	stageGraphics.lineTo( bounds.x + bounds.width, bounds.y + bounds.height );
	stageGraphics.lineTo( bounds.x + bounds.width, bounds.y );
	stageGraphics.lineTo( bounds.x, bounds.y );

	stageGraphics.endFill();
}
/**
 * Checks if an object is withing the screen bounds. Could have a better name.
 */
function checkScreenBounds( rigidBody, bounds ) {
	let lt = rigidBody.sprite.localTransform.apply( new PIXI.Point( rigidBody.sprite.hitArea.left, rigidBody.sprite.hitArea.top ), new PIXI.Point() );
	let lb = rigidBody.sprite.localTransform.apply( new PIXI.Point( rigidBody.sprite.hitArea.left, rigidBody.sprite.hitArea.bottom ), new PIXI.Point() );
	let rt = rigidBody.sprite.localTransform.apply( new PIXI.Point( rigidBody.sprite.hitArea.right, rigidBody.sprite.hitArea.top ), new PIXI.Point() );
	let rb = rigidBody.sprite.localTransform.apply( new PIXI.Point( rigidBody.sprite.hitArea.right, rigidBody.sprite.hitArea.bottom ), new PIXI.Point() );

	// left
	if ( rigidBody.sprite.getBounds().x <= bounds.left ) {
		if ( lt.x <= 0 || rb.x <= 0 ) {
			let distance = Math.abs( lt.x - rb.x );
			rigidBody.currentPosition.x = Math.ceil( distance / 2 );
			rigidBody.forwardVelocity = 0;
		}

		if ( lb.x <= 0 || rt.x <= 0 ) {
			let distance = Math.abs( lb.x - rt.x );
			rigidBody.currentPosition.x = Math.ceil( distance / 2 );
		}
	}

	// right
	if ( rigidBody.sprite.getBounds().x + rigidBody.sprite.getBounds().width >= bounds.right ) {
		if ( lt.x >= bounds.right || rb.x >= bounds.right ) {
			let distance = Math.abs( lt.x - rb.x );
			rigidBody.currentPosition.x = app.view.offsetWidth - Math.ceil( distance / 2 );
			rigidBody.forwardVelocity = 0;
		}

		if ( lb.x >= app.view.offsetWidth || rt.x >= app.view.offsetWidth ) {
			let distance = Math.abs( lb.x - rt.x );
			rigidBody.currentPosition.x = app.view.offsetWidth - Math.ceil( distance / 2 );
		}
	}

	// top
	if ( rigidBody.sprite.getBounds().y <= bounds.top ) {
		if ( lt.y <= bounds.top || rb.y <= bounds.top ) {
			let distance = Math.abs( lt.y - rb.y );
			rigidBody.currentPosition.y = Math.ceil( distance / 2 );
			rigidBody.forwardVelocity = 0;
		}

		if ( lb.y <= bounds.top || rt.y <= bounds.top ) {
			let distance = Math.abs( lb.y - rt.y );
			rigidBody.currentPosition.y = Math.ceil( distance / 2 );
		}
	}

	// bottom
	if ( rigidBody.sprite.getBounds().y + rigidBody.sprite.getBounds().height >= bounds.bottom ) {
		if ( lt.y >= bounds.bottom || rb.y >= bounds.bottom ) {
			let distance = Math.abs( lt.y - rb.y );
			rigidBody.currentPosition.y = app.view.offsetHeight - Math.ceil( distance / 2 );
			rigidBody.forwardVelocity = 0;
		}

		if ( lb.y >= bounds.bottom || rt.y >= bounds.bottom ) {
			let distance = Math.abs( lb.y - rt.y );
			rigidBody.currentPosition.y = app.view.offsetHeight - Math.ceil( distance / 2 );
		}
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

	for ( let i = 0, l = model.children ? model.children.length : 0; i < l; i++ ) {
		let child = model.children[ i ];
		let texture;
		let sprite;
		let tr;

		 if ( model.spriteSheet )
			texture = PIXI.loader.resources[ Config.spriteSheetPath + model.spriteSheet ].textures[ child.id ];
		else
			texture = PIXI.loader.resources[ child.texture ].texture;

		sprite = child.options.tiling ? new PIXI.extras.TilingSprite( texture, child.options.dimensions.w, child.options.dimensions.h ) : new Sprite( texture );
		tr = GameModels.TransformableRenderable( Object.assign( { sprite: sprite }, child.options ) );

		base.addChild( child.name, tr, child.init );
	}

	typeof model.init === 'function' && model.init( base );
	base.update( 0 );
	return { base: base }
}

function setupCoords() {
	const xValue = document.createElement( 'input' );
	const yValue = document.createElement( 'input' );

	xValue.type = 'number';
	xValue.type = 'number';
	yValue.disabled = true;
	yValue.disabled = true;
}
