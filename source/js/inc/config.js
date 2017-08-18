'use strict'
const Util = require( './util.js' );
const CollisionPolygon = require( './collision-polygon.js' );

module.exports = function( PIXI, app ) {

	return {
		spriteSheetPath: 'assets/spritesheets/',
		gameModels: [
			{
				options: {
					basePosition: { x: 256, y: 384 },
					name: 'boards-left',
					rotationConstraints: { pos: 0, neg: 0 },
					positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					debug: true
				},
				init: ( base ) => {
					base.sprite.hitArea = new CollisionPolygon(
						  0,   0,
						128,   0,
						128, 512,
						  0, 512
					);
					// base.sprite.hitArea = new CollisionPolygon(
					// 	-64, -256,
					// 	64, -256,
					// 	64,  256,
					// 	-64,  256
					// );
					base.pivot.x = base.sprite.width / 2;
					base.pivot.y = base.sprite.height / 2;
					// base.sprite.width *= 0.5;
					// base.sprite.height *= 0.5;
				},
				children: [
					{
						texture: 'boards',
						tiling: true,
						options: {
							tiling: true,
							dimensions: { w: 128, h: 512 },
							// basePosition: { x: 15, y: 0 },
							rotationConstraints: { pos: 0, neg: 0 },
							positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } }
						},
						init: ( child, parent) => {
							// child.pivot.x = parent.width / 2;
						}
					}
				]
			},
			{
				options: {
					basePosition: { x: 640, y: 384 },
					name: 'boards-right',
					rotationConstraints: { pos: 0, neg: 0 },
					positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					debug: true
				},
				init: ( base ) => {
					base.sprite.hitArea = new CollisionPolygon(
						  0,   0,
						128,   0,
						128, 512,
						  0, 512
					);
					base.pivot.x = base.sprite.width / 2;
					base.pivot.y = base.sprite.height / 2;
					// base.sprite.width *= 0.5;
					// base.sprite.height *= 0.5;
				},
				children: [
					{
						texture: 'boards',
						tiling: true,
						options: {
							tiling: true,
							dimensions: { w: 128, h: 512 },
							// basePosition: { x: 15, y: 0 },
							rotationConstraints: { pos: 0, neg: 0 },
							positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } }
						},
						init: ( child, parent) => {
							// child.pivot.x = parent.width / 2;
						}
					}
				]
			},
			{
				options: {
					basePosition: { x: 448, y: 192 },
					name: 'boards-top',
					rotationConstraints: { pos: 0, neg: 0 },
					positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					debug: true
				},
				init: ( base ) => {
					base.sprite.hitArea = new CollisionPolygon(
						  0,   0,
						256,   0,
						256, 128,
						  0, 128
					);
					base.pivot.x = base.sprite.width / 2;
					base.pivot.y = base.sprite.height / 2;
				},
				children: [
					{
						texture: 'boards',
						tiling: true,
						options: {
							tiling: true,
							dimensions: { w: 256, h: 128 },
							// basePosition: { x: 15, y: 0 },
							rotationConstraints: { pos: 0, neg: 0 },
							positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } }
						}
					}
				]
			},
			{
				options: {
					basePosition: { x: 352, y: 576 },
					name: 'boards-bottom-left',
					rotationConstraints: { pos: 0, neg: 0 },
					positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					debug: true
				},
				init: ( base ) => {
					base.sprite.hitArea = new CollisionPolygon(
						 0,   0,
						64,   0,
						64, 128,
						 0, 128
					);
					base.pivot.x = base.sprite.width / 2;
					base.pivot.y = base.sprite.height / 2;
				},
				children: [
					{
						texture: 'boards',
						tiling: true,
						options: {
							tiling: true,
							dimensions: { w: 64, h: 128 },
							// basePosition: { x: 15, y: 0 },
							rotationConstraints: { pos: 0, neg: 0 },
							positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } }
						},
						init: ( child, parent) => {
							// child.pivot.x = parent.width / 2;
						}
					}
				]
			},
			{
				options: {
					basePosition: { x: 544, y: 576 },
					name: 'boards-bottom-right',
					rotationConstraints: { pos: 0, neg: 0 },
					positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					debug: true
				},
				init: ( base ) => {
					base.sprite.hitArea = new CollisionPolygon(
						 0,   0,
						64,   0,
						64, 128,
						 0, 128
					);
					base.pivot.x = base.sprite.width / 2;
					base.pivot.y = base.sprite.height / 2;
				},
				children: [
					{
						texture: 'boards',
						tiling: true,
						options: {
							tiling: true,
							dimensions: { w: 64, h: 128 },
							// basePosition: { x: 15, y: 0 },
							rotationConstraints: { pos: 0, neg: 0 },
							positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } }
						},
						init: ( child, parent) => {
							// child.pivot.x = parent.width / 2;
						}
					}
				]
			},
			{
				spriteSheet: 'ships.json',
				options: {
					name: 'dud',
					currentPosition: { x: 512, y: 512 },
					// rotationConstraints: { pos: Infinity, neg: Infinity },
					// positionConstraints: { pos: { x: Infinity, y: Infinity }, neg: { x: Infinity, y: Infinity } },
					maxForwardVelocity: 4,
					forwardVelocityIncrement: .05,
					debug: true,
					postUpdates: [
						function( delta ) {
							// console.log( this.children[ 'rudder' ].currentRotation );
							// console.log( this.rotationVelocity );
							// this.children[ 'rudder' ].currentRotation = -this.currentRotation;
							// this.children[ 'rudder' ].rotationVelocity = -this.rotationVelocity;
						}
					]
				},

				init: ( base ) => {
					// base.sprite.hitArea = new PIXI.Rectangle(
					// 	0,
					// 	0,
					// 	base.sprite.width,
					// 	base.sprite.height
					// );
					base.sprite.hitArea = new CollisionPolygon(
						48,   0,
						71,   7,
						83,  33,
						86,  58,
						83,  87,
						71, 113,
						48, 120,
						38, 120,
						15, 113,
						 3,  87,
						 0,  58,
						 3,  33,
						15,   7,
						38,   0
					);
					// base.sprite.hitArea = new CollisionPolygon(
					// 	 0,   0,
					// 	86,   0,
					// 	86, 120,
					// 	 0, 120
					// );
					base.sprite.interactive = true;
					base.sprite.on( 'click', ( e ) => console.log( e ) );
					base.pivot.x = base.sprite.width / 2;
					base.pivot.y = base.sprite.height / 2;
					base.sprite.width *= 0.5;
					base.sprite.height *= 0.5;
					// base.children.rudder.currentPosition.x = base.sprite.width / 2;
					// base.children.rudder.basePosition.x = base.sprite.width / 2;
				},
				children: [
					{
						name: 'body',
						id: 'turtle-body.png',
						options: {
							// basePosition: { x: 15, y: 0 },
							rotationConstraints: { pos: 0, neg: 0 },
							positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } }
						},
						init: ( child, parent) => {
							// child.pivot.x = parent.width / 2;
						}
					}
				]
			},
			{
				spriteSheet: 'ships.json',
				options: {
					name: 'turtle',
					currentPosition: { x: 384, y: 384 },
					// rotationConstraints: { pos: Infinity, neg: Infinity },
					// positionConstraints: { pos: { x: Infinity, y: Infinity }, neg: { x: Infinity, y: Infinity } },
					maxForwardVelocity: 4,
					forwardVelocityIncrement: .05,
					debug: true,
					postUpdates: [
						function( delta ) {
							// console.log( this.children[ 'rudder' ].currentRotation );
							// console.log( this.rotationVelocity );
							// this.children[ 'rudder' ].currentRotation = -this.currentRotation;
							// this.children[ 'rudder' ].rotationVelocity = -this.rotationVelocity;
						}
					]
				},

				init: ( base ) => {
					// base.sprite.hitArea = new PIXI.Rectangle(
					// 	0,
					// 	0,
					// 	base.sprite.width,
					// 	base.sprite.height
					// );
					base.sprite.hitArea = new CollisionPolygon(
						48,   0,
						71,   7,
						83,  33,
						86,  58,
						83,  87,
						71, 113,
						48, 120,
						38, 120,
						15, 113,
						 3,  87,
						 0,  58,
						 3,  33,
						15,   7,
						38,   0
					);
					// base.sprite.hitArea = new CollisionPolygon(
					// 	 0,   0,
					// 	86,   0,
					// 	86, 120,
					// 	 0, 120
					// );
					base.sprite.interactive = true;
					base.sprite.on( 'click', ( e ) => console.log( e ) );
					base.pivot.x = base.sprite.width / 2;
					base.pivot.y = base.sprite.height / 2;
					base.sprite.width *= .5;
					base.sprite.height *= .5;
					// base.children.rudder.currentPosition.x = base.sprite.width / 2;
					// base.children.rudder.basePosition.x = base.sprite.width / 2;
				},
				children: [
					// left cannons
					// {
					// 	name: 'cannon-left-mid',
					// 	id: 'turtle-cannon-large.png',
					// 	options: {
					// 		basePosition: { x: 0, y: 60 },
					// 		baseRotation: Util.toRadians( 180 ),
					// 		rotationConstraints: { pos: Util.toRadians( 16 ), neg: Util.toRadians( 16 ) },
					// 		positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					// 		maxRotationVelocity: 0.04,
					// 		rotationVelocityIncrement: 0.004,
					// 	},
					// 	init: ( child , parent ) => {
					// 		child.pivot.y = child.sprite.height / 2;
					// 		child.basePosition.x = child.sprite.width;
					// 		child.currentPosition.x = child.sprite.width;
					// 	}
					// },
					// {
					// 	name: 'cannon-left-bow',
					// 	id: 'turtle-cannon-small.png',
					// 	options: {
					// 		basePosition: { x: 41, y: 27 },
					// 		baseRotation: Util.toRadians( -157 ),
					// 		rotationConstraints: { pos: Util.toRadians( 16 ), neg: Util.toRadians( 16 ) },
					// 		positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					// 		maxRotationVelocity: 0.04,
					// 		rotationVelocityIncrement: 0.004
					// 	},
					// 	init: ( child , parent ) => {
					// 		child.pivot.y = child.sprite.height / 2;
					// 	} 
					// },
					// {
					// 	name: 'cannon-left-aft',
					// 	id: 'turtle-cannon-small.png',
					// 	options: {
					// 		basePosition: { x: 41, y: 93 },
					// 		baseRotation: Util.toRadians( 157 ),
					// 		rotationConstraints: { pos: Util.toRadians( 16 ), neg: Util.toRadians( 16 ) },
					// 		positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					// 		maxRotationVelocity: 0.04,
					// 		rotationVelocityIncrement: 0.004
					// 	},
					// 	init: ( child , parent ) => {
					// 		child.pivot.y = child.sprite.height / 2;
					// 	} 
					// },
					// // right cannons
					// {
					// 	name: 'cannon-right-mid',
					// 	id: 'turtle-cannon-large.png',
					// 	options: {
					// 		basePosition: { x: 79, y: 60 },
					// 		rotationConstraints: { pos: Util.toRadians( 16 ), neg: Util.toRadians( 16 ) },
					// 		positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					// 		maxRotationVelocity: 0.04,
					// 		rotationVelocityIncrement: 0.004
					// 	},
					// 	init: ( child , parent ) => {
					// 		child.pivot.y = child.sprite.height / 2;
					// 		// child.basePosition.x = child.sprite.width;
					// 		// child.currentPosition.x = child.sprite.width;
					// 	} 
					// },
					// {
					// 	name: 'cannon-right-bow',
					// 	id: 'turtle-cannon-small.png',
					// 	options: {
					// 		basePosition: { x: 75, y: 27 },
					// 		baseRotation: Util.toRadians( -23 ),
					// 		rotationConstraints: { pos: Util.toRadians( 16 ), neg: Util.toRadians( 16 ) },
					// 		positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					// 		maxRotationVelocity: 0.04,
					// 		rotationVelocityIncrement: 0.004
					// 	},
					// 	init: ( child , parent ) => {
					// 		child.pivot.y = child.sprite.height / 2;
					// 	} 
					// },
					// {
					// 	name: 'cannon-right-aft',
					// 	id: 'turtle-cannon-small.png',
					// 	options: {
					// 		basePosition: { x: 75, y: 93 },
					// 		baseRotation: Util.toRadians( 23 ),
					// 		rotationConstraints: { pos: Util.toRadians( 16 ), neg: Util.toRadians( 16 ) },
					// 		positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					// 		maxRotationVelocity: 0.04,
					// 		rotationVelocityIncrement: 0.004
					// 	},
					// 	init: ( child , parent ) => {
					// 		child.pivot.y = child.sprite.height / 2;
					// 	} 
					// },
					{
						name: 'body',
						id: 'turtle-body.png',
						options: {
							// basePosition: { x: 15, y: 0 },
							rotationConstraints: { pos: 0, neg: 0 },
							positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } }
						},
						init: ( child, parent) => {
							// child.pivot.x = parent.width / 2;
						}
					},
					// {
					// 	name: 'rudder',
					// 	id: 'turtle-rudder.png',
					// 	options: {
					// 		basePosition: { x: 46.23439168930054, y: 110 },
					// 		// rotationConstraints: { pos: Util.toRadians( 20 ), neg: Util.toRadians( 20 ) },
					// 		positionConstraints: { pos: { x: 0, y: 0 }, neg: { x: 0, y: 0 } },
					// 		maxRotationVelocity: 0.02,
					// 		rotationVelocityIncrement: 0.01,
					// 		// stabilizeRotation: true,
					// 		debug: true
					// 	},
					// 	init: ( child , parent ) => {
					// 		child.pivot.x = child.sprite.width / 2;

					// 		child.currentPosition.x = parent.sprite.width / 2;
					// 		child.basePosition.x = child.currentPosition.x;
					// 	}
					// }
				]
			}
		]
	};
};
