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
	.add( 'circle-target', 'assets/images/circle-target.png' )
	.load( setup );

window.gameModels = [];
window.current = {
	direction: 163,
	force: 1
};

window.friction = 0.98;

let emitterManager;
window.emitterParent = new PIXI.Container();
let stageGraphics = new PIXI.Graphics();


function setup( loader, resources ) {
	window.emitterParent.width = viewWidth;
	window.emitterParent.height = viewHeight;
	window.emitterParent.pivot.x = viewWidth / 2;
	window.emitterParent.pivot.y = viewHeight / 2;
	app.stage.addChild( window.emitterParent );
	emitterManager = EmitterManager(
		resources.emitter.data,
		window.emitterParent,
		// {
		// 	min: Vec2(),
		// 	max: Vec2( viewWidth / 2, viewHeight / 2 )
		// },
		Vec2( viewWidth / 2, viewHeight / 2 ),
		[ resources[ 'particle' ].texture ],
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
// app.stage.width *= 0.5;
// app.stage.height *= 0.5;

	window.turtle = gameModels.find( ( model ) => model.base.name === 'turtle' ).base;

	// setup the camera to follow turtle/player.
	app.stage.position.x = (app.renderer.width / scale) / 2;
	app.stage.position.y = (app.renderer.height / scale) / 2;
	app.stage.pivot.x = turtle.currentPosition.x;
	app.stage.pivot.y = turtle.currentPosition.y;

	SteeringKeyboard();

	app.ticker.add( animate );
}

window.animating = true;

let activeTarget;
let docked = false;

window.addEventListener( 'dock', function() {
	if ( activeTarget && !docked ) {
		turtle.basePosition.x = activeTarget.base.basePosition.x;
		turtle.basePosition.y = activeTarget.base.basePosition.y;
		turtle.positionConstraints.pos = { x: 0, y: 0 };
		turtle.positionConstraints.neg = { x: 0, y: 0 };
		turtle.rotationConstraints.pos = 0;
		turtle.rotationConstraints.neg = 0;
		docked = true;
	} else if ( docked ) {
		turtle.basePosition.x = 0;
		turtle.basePosition.y = 0;
		turtle.positionConstraints.pos = { x: Infinity, y: Infinity };
		turtle.positionConstraints.neg = { x: Infinity, y: Infinity };
		turtle.rotationConstraints.pos = Infinity;
		turtle.rotationConstraints.neg = Infinity;
		docked = false;
	}
}, false );

let fps = 30;
let dt = 1 / fps;
let accumulator = 0;

function animate( delta ) {
	stageGraphics.clear();

	document.getElementById( 'frame-rate' ).dataset.framerate = app.ticker.FPS.toPrecision( 2 );

	accumulator += delta;
	while ( accumulator > dt ) {
		// console.log( 'physics' );
		accumulator -= dt;
	}
	// console.log( delta );
	updateGameModels( delta );
	checkCollisions( delta );

	emitterManager.update( delta, [ current ] );

	updateFollowCamera( delta );

}

function updateFollowCamera( delta ) {
	// make the camera follow the turtle, but only once the turtle is a certain distance (50) on either axis.
	let xDist = app.stage.pivot.x - turtle.currentPosition.x;
	let yDist = app.stage.pivot.y - turtle.currentPosition.y;

	if ( Math.abs( xDist ) > 50 ) {
		app.stage.pivot.x -= xDist / 100 * delta;
	}
	if ( Math.abs( yDist ) > 50 ) {
		app.stage.pivot.y -= yDist / 100 * delta;
	}
}

function checkCollisions() {
	let collisions = [];
	// Check each moving (movable really) object for a collision with every other object.
	// @TODO check only actually moving and check w/i same area. 
	let collideables = gameModels.filter( ( model ) => {
		return model.base.positionConstraints.neg.x !== 0 ||
		model.base.positionConstraints.neg.y !== 0 ||
		model.base.positionConstraints.pos.x !== 0 ||
		model.base.positionConstraints.pos.y !== 0
	} );

	for ( let i = 0, l = collideables.length; i < l; i++ ) {
		for ( let ii = 0, ll = gameModels.length; ii < ll; ii++ ) {
			if ( collideables[ i ] !== gameModels[ ii ] ) {
				let collision = checkCollision( collideables[ i ], gameModels[ ii ] );
				collisions[ collisions.length ] = collision;
				if ( collision ) {
					if ( gameModels[ ii ].base.solid ) {
						// console.log( collision.overlapV.toString() + ' ' + collision.overlap );
						collision.one.base.currentPosition.x -= collision.overlapV.x;
						collision.one.base.currentPosition.y -= collision.overlapV.y;
					// make target interactable
					} else {
						gameModels[ ii ].base.sprite.children[ 0 ].tint = 0x4ae9f9;
						gameModels[ ii ].base.children.target.alpha = .5;
						activeTarget = gameModels[ ii ];
					}
				// deactivate an activeTarget
				} else if ( gameModels[ ii ] === activeTarget ) {
					activeTarget = undefined;
					gameModels[ ii ].base.sprite.children[ 0 ].tint = 0xffffff;
					gameModels[ ii ].base.children.target.alpha = .25;
				}
				// if ( collision && collision.twoInOne ) {
				// 	collision.two.base.currentPosition.x += collision.overlapV.x;
				// 	collision.two.base.currentPosition.y += collision.overlapV.y;
				// }
			}
		}
	}
}
function updateGameModels( delta ) {
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
}

function applyTransformsToPoint( point, source ) {
	point.sub( source.base.pivot.x, source.base.pivot.y )
		// @TODO needs the mul( 2 ) or detection only works on objects
		// with .5 scale. Figure out why.
		.scale( Vec2( source.base.sprite.scale ).mul( 2 ) )
		.rotate( source.base.currentRotation )
		.add( source.base.currentPosition );
}

function checkCollision( one, two ) {
	let lengthOne = one.base.sprite.hitArea.points.length;
	let lengthTwo = two.base.sprite.hitArea.points.length;
	let pointsOne = [];
	let pointsTwo = [];
	let p;
	let collision = {
		one: one,
		two: two,
		active: true,
		overlapN: Vec2(),
		overlap: Number.MAX_VALUE,
		oneInTwo: true,
		twoInOne: true
	};

	// make vector arrays of the incoming points.
	// points have the game object's transform applied
	for ( let i = 0, l = lengthOne + lengthTwo; i < l; i += 2 ) {
		if ( i < lengthOne ) {
			p = Vec2( one.base.sprite.hitArea.points[ i ], one.base.sprite.hitArea.points[ i + 1 ] );
			applyTransformsToPoint( p, one );
			pointsOne.push( p );
		} else {
			p = Vec2( two.base.sprite.hitArea.points[ i - lengthOne ], two.base.sprite.hitArea.points[ i - lengthOne + 1 ] );
			applyTransformsToPoint( p, two );
			pointsTwo.push( p );
		}
	}

	/**
	 * loop through the points of the first poly
	 */
	for ( let i = 0, l = pointsOne.length; i < l; i++ ) {
		let normal = one.base.sprite.hitArea.normals[ i ];
		let separating = isSeparatingAxis( one, two, pointsOne, pointsTwo, normal, collision );

		if ( separating ) return false;
	}

	for ( let i = 0, l = pointsTwo.length; i < l; i++ ) {
		let normal = two.base.sprite.hitArea.normals[ i ];
		let separating = isSeparatingAxis( one, two, pointsOne, pointsTwo, normal, collision );

		if ( separating ) return false;
	}

	if ( collision )
		collision.overlapV = Vec2( collision.overlapN ).scale( collision.overlap );

	return collision || true;
}

function isSeparatingAxis( one, two, pointsOne, pointsTwo, normal, collision ) {
	let positionOne = one.base.currentPosition;
	let positionTwo = two.base.currentPosition;
	let rangeOne = projectPoints( pointsOne, normal );
	let rangeTwo = projectPoints( pointsTwo, normal );
	let offsetVec = Vec2( positionTwo ).sub( positionOne );
	let offsetDot = offsetVec.dot( normal );

	rangeTwo.min += offsetDot;
	rangeTwo.max += offsetDot;

	if ( rangeOne.min > rangeTwo.max || rangeTwo.min > rangeOne.max ) return true;

	if ( collision ) {
		var overlap = 0;

		// one starts further left than two
		if ( rangeOne.min < rangeTwo.min ) {
			collision.oneInTwo = false;
			// one ends before two does. We have to pull one out of two
			if ( rangeOne.max < rangeTwo.max ) { 
				overlap = rangeOne.max - rangeTwo.min;
				collision.twoInOne = false;
			// two is fully inside one. Pick the shortest way out.
			} else {
				var option1 = rangeOne.max - rangeTwo.min;
				var option2 = rangeTwo.max - rangeOne.min;
				overlap = option1 < option2 ? option1 : -option2;
			}
		// two starts further left than one
		} else {
			collision.twoInOne = false;
			// two ends before one ends. We have to push one out of two
			if ( rangeOne.max > rangeTwo.max ) { 
				overlap = rangeOne.min - rangeTwo.max;
				collision.oneInTwo = false;
			// one is fully inside two. Pick the shortest way out.
			} else {
				var option1 = rangeOne.max - rangeTwo.min;
				var option2 = rangeTwo.max - rangeOne.min;
				overlap = option1 < option2 ? option1 : -option2;
			}
		}
		var absOverlap = Math.abs( overlap );
		if ( absOverlap < collision.overlap ) {
			collision.overlap = absOverlap;
			collision.overlapN.set( normal );
			if ( overlap < 0 ) {
				collision.overlapN.reverse();
			}
		}
	}

	return false;
}

/**
 * Projects a set of points onto an axis/normal.
 * Returns the minimum/maximum range of the projected points.
 */
function projectPoints( points, normal ) {
	let min = Number.MAX_VALUE;
	let max = -Number.MAX_VALUE;

	for ( let i = 0, l = points.length; i < l; i++ ) {
		let dot = points[ i ].dot( normal );
		min = dot < min ? dot : min;
		max = dot > max ? dot : max;
	}

	return { min: min, max: max };
}

function drawDebug( model ) {
	// draw the hitarea if it has it. only works for collision polygons.
	if ( model.base.sprite.hitArea ) {
		stageGraphics.lineStyle( 1, 0x00ff32, 1 );

		// set the first point before the loop for moveTo
		let p = Vec2(
			model.base.sprite.hitArea.points[ 0 ] - model.base.pivot.x,
			model.base.sprite.hitArea.points[ 1 ] - model.base.pivot.y
		).scale( model.base.sprite.scale )
		.rotate( model.base.sprite.rotation )
		.add( model.base.currentPosition );

		stageGraphics.moveTo( p.x, p.y );

		// draw a line from each point to the one after it 
		for ( let i = 2, l = model.base.sprite.hitArea.points.length; i < l; i += 2 ) {
			p.set(
				model.base.sprite.hitArea.points[ i ],
				model.base.sprite.hitArea.points[ i + 1 ]
			).sub( model.base.pivot.x, model.base.pivot.y )
			.scale( model.base.sprite.scale )
			.rotate( model.base.sprite.rotation )
			.add( model.base.currentPosition );

			stageGraphics.lineTo( p.x, p.y );
		}

		// draw a final line back to the original point to close the polygon.
		p.set(
			model.base.sprite.hitArea.points[ 0 ],
			model.base.sprite.hitArea.points[ 1 ]
		).sub( model.base.pivot.x, model.base.pivot.y )
		.scale( model.base.sprite.scale )
		.rotate( model.base.sprite.rotation )
		.add( model.base.currentPosition );

		stageGraphics.lineTo( p.x, p.y );

		// draw the normal lines
		for ( let i = 0, l = model.base.sprite.hitArea.points.length; i < l; i += 2 ) {
			// get the point in the middle of the edge.
			let halfEdge = Vec2(
				model.base.sprite.hitArea.points[ i ] + ( model.base.sprite.hitArea.edges[ Math.ceil( i / 2 ) ].x / 2 ),
				model.base.sprite.hitArea.points[ i + 1 ] + ( model.base.sprite.hitArea.edges[ Math.ceil( i / 2 ) ].y / 2 )
			);

			// get the endpoint for the normal line.
			let end = halfEdge.copy().add( model.base.sprite.hitArea.normals[ Math.ceil( i / 2 ) ].copy().mul( 10 ) )
				.sub( model.base.pivot )
				.scale( model.base.sprite.scale.x, model.base.sprite.scale.y )
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
	}

	// draw the AABB for the sprite.
	let bounds = model.base.sprite.getBounds();

	stageGraphics.lineStyle( 1, 0xff4cc7, 1 );
	stageGraphics.moveTo(
		bounds.x + app.stage.pivot.x - app.stage.position.x,
	bounds.y + app.stage.pivot.y - app.stage.position.y
	);
	stageGraphics.lineTo(
		bounds.x + app.stage.pivot.x - app.stage.position.x,
		bounds.y + app.stage.pivot.y - app.stage.position.y + bounds.height
	);
	stageGraphics.lineTo(
		bounds.x + app.stage.pivot.x - app.stage.position.x + bounds.width,
		bounds.y + app.stage.pivot.y - app.stage.position.y + bounds.height
	);
	stageGraphics.lineTo(
		bounds.x + app.stage.pivot.x - app.stage.position.x + bounds.width,
		bounds.y + app.stage.pivot.y - app.stage.position.y
	);
	stageGraphics.lineTo(
		bounds.x + app.stage.pivot.x - app.stage.position.x,
		bounds.y + app.stage.pivot.y - app.stage.position.y
	);

	stageGraphics.endFill();
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

		base.addChild( child.options.name, tr, child.init );
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
