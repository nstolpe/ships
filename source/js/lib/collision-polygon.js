'use strict';

const PIXI = require( 'pixi.js' );
const Vec2 = require( './vector2.js' );

function Vector( x, y ) {
	const proto = {
		x: x || 0,
		y: y || 0,
		perp() {

		}
	}
}

module.exports = function ( ...points ) {
	const proto = {
		edges: [],
		normals: [],
		setEdges() {
			// create an edge and normal between each set of points.
			for ( let i = 0, l = this.points.length; i < l; i += 2 ) {
				let p1 = Vec2( poly.points[ i ], poly.points[ i + 1 ] );
				// need to start again and grab the original point's x and y
				let p2 = i + 2 < l ? Vec2( poly.points[ i + 2 ], poly.points[ i + 3 ] ) : Vec2( poly.points[ 0 ], poly.points[ 1 ] );
				let edge = Vec2( p2.x - p1.x, p2.y - p1.y );
				let perp = edge.copy().perp();
				let perpLength = perp.len();
				let normal = perp.copy().nor();
				this.edges[ Math.ceil( i / 2 ) ] = edge;
				this.normals[ Math.ceil( i / 2 ) ] = normal;
				// this.edges[ i ] = edge.x;
				// this.edges[ i + 1 ] = edge.y;
			}
		}
	};

	const poly = Object.assign( Object.create( PIXI.Polygon.prototype ), proto );
	PIXI.Polygon.apply( poly, points );
	poly.setEdges();
	return poly;
}
