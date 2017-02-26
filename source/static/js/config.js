'use strict'
const Util = require( './util.js' );

module.exports = {
	spriteSheetPath: '../assets/spritesheets/',
	gameModels: [
		{
			name: 'turtle',
			spriteSheet: 'ships.json',
			options: {
				startPosition: { x: 200, y: 300 },
				rotationConstraints: { pos: Infinity, neg: Infinity }
			},
			init: ( base ) => {
				base.pivot.x = base.element.width / 2;
				base.pivot.y = base.element.height;
				base.children.rudder.currentPosition.x = base.element.width / 2;
				base.children.rudder.basePosition.x = base.element.width / 2;
			},
			children: [
				// left cannons
				{
					name: 'cannon-left-mid',
					id: 'turtle-cannon-large.png',
					options: {
						basePosition: { x: 0, y: 60 },
						baseRotation: Util.toRadians( 180 ),
						rotationConstraints: { pos: Util.toRadians( 18 ), neg: Util.toRadians( 18 ) }
					},
					init: ( child , parent ) => {
						child.pivot.y = child.element.height / 2;
						child.basePosition.x = child.element.width;
						child.currentPosition.x = child.element.width;
					}
				},
				{
					name: 'cannon-left-bow',
					id: 'turtle-cannon-small.png',
					options: {
						basePosition: { x: 41, y: 27 },
						baseRotation: Util.toRadians( -157 ),
						rotationConstraints: { pos: Util.toRadians( 18 ), neg: Util.toRadians( 18 ) }
					},
					init: ( child , parent ) => {
						child.pivot.y = child.element.height / 2;
					} 
				},
				{
					name: 'cannon-left-aft',
					id: 'turtle-cannon-small.png',
					options: {
						basePosition: { x: 41, y: 93 },
						baseRotation: Util.toRadians( 157 ),
						rotationConstraints: { pos: Util.toRadians( 18 ), neg: Util.toRadians( 18 ) }
					},
					init: ( child , parent ) => {
						child.pivot.y = child.element.height / 2;
					} 
				},
				// right cannons
				{
					name: 'cannon-right-mid',
					id: 'turtle-cannon-large.png',
					options: {
						basePosition: { x: 79, y: 60 },
						rotationConstraints: { pos: Util.toRadians( 18 ), neg: Util.toRadians( 18 ) }
					},
					init: ( child , parent ) => {
						child.pivot.y = child.element.height / 2;
						// child.basePosition.x = child.element.width;
						// child.currentPosition.x = child.element.width;
					} 
				},
				{
					name: 'cannon-right-bow',
					id: 'turtle-cannon-small.png',
					options: {
						basePosition: { x: 75, y: 27 },
						baseRotation: Util.toRadians( -23 ),
						rotationConstraints: { pos: Util.toRadians( 18 ), neg: Util.toRadians( 18 ) }
					},
					init: ( child , parent ) => {
						child.pivot.y = child.element.height / 2;
					} 
				},
				{
					name: 'cannon-right-aft',
					id: 'turtle-cannon-small.png',
					options: {
						basePosition: { x: 75, y: 93 },
						baseRotation: Util.toRadians( 23 ),
						rotationConstraints: { pos: Util.toRadians( 18 ), neg: Util.toRadians( 18 ) }
					},
					init: ( child , parent ) => {
						child.pivot.y = child.element.height / 2;
					} 
				},
				{
					name: 'body',
					id: 'turtle-body.png',
					options: {
						basePosition: { x: 15, y: 0 }
					},
					init: ( child, parent) => {
						// child.pivot.x = parent.width / 2;
					}
				},
				{
					name: 'rudder',
					id: 'turtle-rudder.png',
					options: {
						basePosition: { x: 46.23439168930054, y: 110 }
					},
					init: ( child , parent ) => {
						child.pivot.x = child.element.width / 2;

						child.currentPosition.x = parent.element.width / 2;
						child.basePosition.x = child.currentPosition.x;
					}
				}
			]
		}
	]
};
