'use strict'
const Util = require( './util.js' );

module.exports = function( PIXI, app ) {

	return {
		spriteSheetPath: 'assets/spritesheets/',
		gameModels: [
			{
				name: 'turtle',
				spriteSheet: 'ships.json',
				options: {
					currentPosition: { x: 200, y: 300 },
					// rotationConstraints: { pos: Infinity, neg: Infinity },
					// positionConstraints: { pos: { x: Infinity, y: Infinity }, neg: { x: Infinity, y: Infinity } },
					maxForwardVelocity: 4,
					forwardVelocityIncrement: .05,
					debug: true,
					postUpdates: [
						function( delta ) {
							if ( this.debug ) {
								let bounds = this.sprite.getBounds();

								if ( this.graphics ) {
									this.graphics.clear();
								} else {
									this.graphics = new PIXI.Graphics();
								}

								this.graphics.lineStyle( 1, 0xff0000, 1 );
								this.graphics.moveTo( bounds.x, bounds.y );
								this.graphics.lineTo( bounds.x, bounds.y + bounds.height );
								this.graphics.lineTo( bounds.x + bounds.width, bounds.y + bounds.height );
								this.graphics.lineTo( bounds.x + bounds.width, bounds.y  );
								this.graphics.lineTo( bounds.x, bounds.y );
								app.stage.addChild( this.graphics );
								// graphics.endFill();
							} else {
								let graphicsChild = app.stage.children.find( ( child ) => child === this.graphics );

								if ( graphicsChild )
									app.stage.removeChild( graphicsChild );
							}
							// console.log( this.children[ 'rudder' ].currentRotation );
							// console.log( this.rotationVelocity );
							// this.children[ 'rudder' ].currentRotation = -this.currentRotation;
							// this.children[ 'rudder' ].rotationVelocity = -this.rotationVelocity;
						}
					]
				},

				init: ( base ) => {
					base.pivot.x = base.sprite.width / 2;
					base.pivot.y = base.sprite.height / 2;
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
							basePosition: { x: 15, y: 0 },
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
