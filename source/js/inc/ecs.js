'use strict';

const PIXI = require( 'pixi.js' );
const Matter = require( 'matter-js' );
const Vector = Matter.Vector;
const Bodies = Matter.Bodies;
const Sprite = PIXI.Sprite;
const TilingSprite = PIXI.extras.TilingSprite;

// weakmap for private data (components array) accessible w/ prototype methods
const ComponentsMap = new WeakMap();

const EntityProto = Object.create( Object.prototype, {
	'class': { value: 'Entity' },
	'id': { value: 0 },
	/**
	 * Returns a copy of the components array from components map.
	 * Will error if EntityProto is used directly.
	 * The returned array is not modifiable, but the components inside are.
	 */
	'components': {
		get() {
			const components = ComponentsMap.get( this );
			return components.slice( 0, components.length )
		},
		enumerable: true
	},
	/**
	 * Adds the incoming components to the array in ComponentsMap
	 */
	'addComponents': {
		value: function( ...additions ) {
			Array.prototype.push.apply( ComponentsMap.get( this ), additions );
		}
	},
	'removeComponents': {
		value: function( ...subtractions ) {
			const components = ComponentsMap.get( this );
			const spliced = [];

			subtractions.forEach( cmpnt => {
				let index = components.indexOf( cmpnt );
				if ( index >= 0 ) spliced.push( components.splice( index, 1 )[ 0 ] );
			} );

			return spliced;
		}
	},
	'clearComponents': {
		value: function() {
			const components = ComponentsMap.get( this );
			return components.splice( 0, components.length );
		}
	}
} );

function Entity( ...components ) {
	const entity = Object.create( EntityProto, {
		'id': {
			value: ( +new Date() ).toString( 16 ) + ( Math.random() * 100000000 | 0 ).toString( 16 ),
			enumerable: true
		}
	} );

	ComponentsMap.set( entity, components );
	return entity;
}

// weakmap for private data (components array) accessible w/ prototype methods
const EntitiesMap = new WeakMap();

const EngineProto = Object.create( Object.prototype, {
	'class': { value: 'Engine' },
	'id': { value: 0 },
	'entities': {
		get() {
			const entities = EntitiesMap.get( this );
			return entities.slice( 0, entities.length )
		},
		enumerable: true
	},
	'addEntities': {
		value: function( ...additions ) {
			Array.prototype.push.apply( EntitiesMap.get( this ), additions );
		}
	},
	'removeEntites': {
		value: function( ...subtractions ) {
			const entities = EntitiesMap.get( this );
			const spliced = [];

			subtractions.forEach( entity => {
				let index = entities.indexOf( entity );
				if ( index >= 0 ) spliced.push( entities.splice( index, 1 )[ 0 ] );
			} );

			return spliced;
		}
	},
	'clearEntities': {
		value: function() {
			const entities = EntitiesMap.get( this );
			return entities.splice( 0, entities.length );
		}
	}
} );

function Engine( ...entities ) {
	const engine =  Object.create( EngineProto, {
		'id': {
			value: ( +new Date() ).toString( 16 ) + ( Math.random() * 100000000 | 0 ).toString( 16 ),
			enumerable: true
		}
	} );

	EntitiesMap.set( engine, entities );
	return engine;
}

const ComponentProto = Object.create( Object.prototype, {
	'class': { value: 'Component' },
	'type': {
		value: 'component',
		enumerable: true,
		writable: true
	},
	'data': {
		value: true,
		enumerable: true,
		writable: true
	}
} );

const Components = {
	position( x, y ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'position',
			data: Vector( ~~x, ~~y )
		} );
	},
	rotation( angle ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'rotation',
			data: ~~angle
		} );
	},
	scale( x, y ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'scale',
			data: Vector( ~~x, ~~y )
		} );
	},
	polygon( vertices, options ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'polygon',
			data: Bodies.fromVertices( 0, 0, vertices, Object.assign( {}, options ) )
		} );
	},
	rectangle( width, height, options ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'rectangle',
			data: Bodies.rectangle( 0, 0, ~~width, ~~height, Object.assign( {}, options ) )
		} );
	},
	circle( radius ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'cirlce',
			data: Bodies.circle( 0, 0, ~~radius, Object.assign( {}, options ) )
		} );
	},
	sprite( texture ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'sprite',
			data: new Sprite( texture )
		} );
	},
	tilingSprite( texture, width, height ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'tiling-sprite',
			data: new TilingSprite( texture, width, height )
		} );
	},
	children( children ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'children',
			data: Array.isArray( children ) ? children : []
		} );
	},
	force( direction, magnitude ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'force',
			data: {
				direction: direction,
				magnitude: magnitude
			}
		} );
	},
	color( color ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'color',
			data: color
		} );
	},
	name( name ) {
		return Object.assign( Object.create( ComponentProto ), {
			type: 'name',
			data: name
		} );
	}
};

module.exports = {
	Components: Components,
	Entity: Entity,
	Engine: Engine
};
