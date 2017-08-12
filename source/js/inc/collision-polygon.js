'use strict';

const PIXI = require( 'pixi.js' );

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
				let p1 = { x: poly.points[ i ], y: poly.points[ i + 1 ] };
				// need to start again and grab the original point's x and y
				let p2 = i + 2 < l ? { x: poly.points[ i + 2 ], y: poly.points[ i + 3 ] } : { x: poly.points[ 0 ], y: poly.points[ 1 ] };
				let edge = { x: p2.x - p1.x, y: p2.y - p1.y };
				let perp = { x: edge.y, y: -edge.x };
				let perpLength = Math.sqrt( perp.x * perp.x + perp.y * perp.y );
				let normal = perpLength != 0 ? { x: perp.x / perpLength, y: perp.y / perpLength } : perp;
				this.edges[ i ] = edge.x;
				this.edges[ i + 1 ] = edge.y;
				this.normals[ i ] = normal.x;
				this.normals[ i + 1 ] = normal.y;
			}
		}
	};

	const poly = Object.assign( Object.create( PIXI.Polygon.prototype ), proto );
	PIXI.Polygon.apply( poly, points );
	poly.setEdges();
	return poly;
}
