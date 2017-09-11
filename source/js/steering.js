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
	force: 40,
	mass: true,
	magnitude: 300
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

let fps = 60;
let dt = 1 / fps;
let accumulator = 0;

function animate( delta ) {
	stageGraphics.clear();

	document.getElementById( 'frame-rate' ).dataset.framerate = app.ticker.FPS.toPrecision( 2 );

	accumulator += app.ticker.elapsedMS / 1000;
	var numUpdateSteps = 0;
	if ( accumulator > 0.1 ) accumulator = 0.1;
	while ( accumulator > dt ) {
		accumulator -= dt;
		updateGameModels( dt );
		checkCollisions( dt );
		updateFollowCamera( dt );
		emitterManager.update( dt, [ current ] );
		// if (++numUpdateSteps >= 240) {
		// 	accumulator = 0;
		// 	break;
		// }
		// if ( accumulator >= dt) console.log( accumulator );
	}

	// console.log( delta );
	// updateGameModels( app.ticker.elapsedMS / 100 );
	// checkCollisions( app.ticker.elapsedMS / 100 );

	// emitterManager.update( app.ticker.elapsedMS / 100, [ current ] );

	// updateFollowCamera( app.ticker.elapsedMS / 100 );

}

function updateFollowCamera( delta ) {
	// make the camera follow the turtle, but only once the turtle is a certain distance (50) on either axis.
	let xDist = app.stage.pivot.x - turtle.currentPosition.x;
	let yDist = app.stage.pivot.y - turtle.currentPosition.y;

	if ( Math.abs( xDist ) > 50 ) {
		app.stage.pivot.x -= xDist / 1 * delta;
	}
	if ( Math.abs( yDist ) > 50 ) {
		app.stage.pivot.y -= yDist / 1 * delta;
	}
}

function checkCollisions() {
	// Check each moving (movable really) object for a collision with every other object.
	// @TODO check only actually moving and check w/i same area. 
	let collideables = gameModels.filter( ( model ) => {
		return model.base.positionConstraints.neg.x !== 0 ||
		model.base.positionConstraints.neg.y !== 0 ||
		model.base.positionConstraints.pos.x !== 0 ||
		model.base.positionConstraints.pos.y !== 0
	} );

	for ( let i = 0; i < collideables.length; i++ ) {
		for ( let ii = 0; ii < gameModels.length; ii++ ) {
			if ( collideables[ i ] !== gameModels[ ii ] ) {
				let collision = checkCollision( collideables[ i ], gameModels[ ii ] );
				if ( collision ) {
					if ( gameModels[ ii ].base.solid ) {
						// Just pushes one away. Should be better.@TODO better
						collision.one.base.currentPosition.x -= collision.overlapV.x;
						collision.one.base.currentPosition.y -= collision.overlapV.y;
					} else {
						// non-solid game models are the dock targets, make them interactable
						// @TODO this does not belong. Move.
						gameModels[ ii ].base.sprite.children[ 0 ].tint = 0x4ae9f9;
						gameModels[ ii ].base.children.target.alpha = .5;
						activeTarget = gameModels[ ii ];
					}
				} else if ( gameModels[ ii ] === activeTarget ) {
					// deactivate activeTarget if it's become inactive
					// @TODO this doesn't belong here, move it somewhere better.
					activeTarget = undefined;
					gameModels[ ii ].base.sprite.children[ 0 ].tint = 0xffffff;
					gameModels[ ii ].base.children.target.alpha = .25;
				}
				// do something with different collisions here.
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
			forces: [ window.current ],
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
	let featureOne;
	let featureTwo;

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

	// loop through the points of the first poly
	for ( let i = 0, l = pointsOne.length; i < l; i++ ) {
		let normal = one.base.sprite.hitArea.normals[ i ];
		let rangeOne = projectPoints( pointsOne, normal );
		let rangeTwo = projectPoints( pointsTwo, normal );
		let offset =  Vec2( two.base.currentPosition ).sub( one.base.currentPosition ).dot( normal );

		rangeTwo.min += offset;
		rangeTwo.max += offset;

		if ( rangesOverlap( rangeOne, rangeTwo) ) {
			// if the ranges overlap, it's not a separating axis. get the collision
			collision = setCollision( rangeOne, rangeTwo, normal, collision );
		} else {
			// if not, it is a separating axis. only one is necessary, so exit.
			return false;
		}
	}

	// then the second 
	for ( let i = 0, l = pointsTwo.length; i < l; i++ ) {
		let normal = two.base.sprite.hitArea.normals[ i ];
		let rangeOne = projectPoints( pointsOne, normal );
		let rangeTwo = projectPoints( pointsTwo, normal );
		let offset =  Vec2( two.base.currentPosition ).sub( one.base.currentPosition ).dot( normal );

		rangeTwo.min += offset;
		rangeTwo.max += offset;

		if ( rangesOverlap( rangeOne, rangeTwo) ) {
			// if the ranges overlap, it's not a separating axis. get the collision
			collision = setCollision( rangeOne, rangeTwo, normal, collision );
		} else {
			// if not, it is a separating axis. only one is necessary, so exit.
			return false;
		}
	}

	collision.overlapV = Vec2( collision.overlapN ).scale( collision.overlap );

	// wrap in an if cause it will likely be turned on/off
	if ( 1 === 1 ) {
		featureOne = getFeature( pointsOne, collision.overlapN );
		featureTwo = getFeature( pointsTwo, collision.overlapN.copy().reverse() );

		doClipping( featureOne, featureTwo, collision.overlapN )
	}
	return collision;
}

function doClipping( one, two, normal ) {
	let ref;
	let inc;
	let flip = false;
	let refv = Vec2();

	if ( Math.abs( one.edge.dot( normal ) ) <= Math.abs( two.edge.dot( normal ) ) ) {
		ref = one;
		inc = two;
	} else {
		ref = two;
		inc = one;
		flip = true;
	}

	refv.set( ref ).nor();

	let o1 = refv.dot( ref.v1 );
	let cp = clip( inc.v1, inc.v2, refv, o1 );
}

function clip( v1, v2, normal, o ) {

}
function getFeature( points, normal ) {
	let vertex = farthestVertex( points, normal );
	let index = points.indexOf( vertex );
	let prev = points[ ( index - 1 ) % points.length ];
	let next = points[ ( index + 1 ) % points.length ];
	let l = vertex.copy().sub( next ).nor();
	let r = vertex.copy().sub( prev ).nor();

	if ( r.dot( normal ) <= l.dot( normal ) ) {
		// prev (right) is closer to perp
		// max, 1st, last
		return {
			max: vertex,
			edge: vertex.copy().sub( prev ),
			v1: prev,
			v2: vertex
		};
	} else {
		// next (left) is closer to per
		// max, 1st, last
		return {
			max: vertex,
			edge: next.copy().sub( vertex ),
			v1: vertex,
			v2: next
		};
	}
}

function farthestVertex( points, direction ) {
	let farthestProjection = -Number.MAX_VALUE;
	let farthestVertex;

	for ( let i = 0, l = points.length; i < l; i++ ) {
		let projection = direction.dot( points[ i ] );

		if ( projection > farthestProjection ) {
			farthestProjection = projection;
			farthestVertex = points[ i ];
			// console.log( 'a: ' + farthestProjection );
			// console.log( 'b: ' + points[ i ].dot( direction ) );
		}
	}

	return farthestVertex;
}
// populates a collision object.
function setCollision( rangeOne, rangeTwo, normal, collision ) {
	let overlap = 0;
	let overlap1;
	let overlap2;
	let absOverlap;
	// collision = Object.assign( {
	// 	one: one,
	// 	two: two,
	// 	active: true,
	// 	overlapN: Vec2(),
	// 	overlap: Number.MAX_VALUE,
	// 	oneInTwo: true,
	// 	twoInOne: true
	// }, collision );
	// one starts lower than two
	if ( rangeOne.min < rangeTwo.min ) {
		collision.oneInTwo = false;
		// one ends before two does. We have to pull one out of two
		if ( rangeOne.max < rangeTwo.max ) {
			overlap = rangeOne.max - rangeTwo.min;
			collision.twoInOne = false;
		// two is fully inside one. Pick the shortest way out.
		} else {
			overlap1 = rangeOne.max - rangeTwo.min;
			overlap2 = rangeTwo.max - rangeOne.min;
			overlap = overlap1 < overlap2 ? overlap1 : -overlap2;
		}
	// two starts lower than one
	} else {
		collision.twoInOne = false;
		// two ends before one ends. push one out of two
		if ( rangeOne.max > rangeTwo.max ) {
			overlap = rangeOne.min - rangeTwo.max;
			collision.oneInTwo = false;
		// one is fully inside two. pick the shortest way out.
		} else {
			overlap1 = rangeOne.max - rangeTwo.min;
			overlap2 = rangeTwo.max - rangeOne.min;
			overlap = overlap1 < overlap2 ? overlap1 : -overlap2;
		}
	}

	absOverlap = Math.abs( overlap );

	if ( absOverlap < collision.overlap ) {
		collision.overlap = absOverlap;
		collision.overlapN.set( normal );
		if ( overlap < 0 ) {
			collision.overlapN.reverse();
		}
	}

	return collision;
}

function rangesOverlap( one, two ) {
	return one.min <= two.max && two.min <= one.max
}

/**
 * Projects a set of points onto an axis/normal.
 * Returns the minimum/maximum range of the projected points.
 */
function projectPoints( points, normal ) {
	let min = Number.MAX_VALUE;
	let max = -Number.MAX_VALUE;
	let dot;

	for ( let i = 0, l = points.length; i < l; i++ ) {
		dot = points[ i ].dot( normal );
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
			let end = halfEdge.copy().add( model.base.sprite.hitArea.normals[ Math.ceil( i / 2 ) ].copy().reverse().mul( 10 ) )
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
