'use strict';

const PIXI = require( 'pixi.js' );
const Matter = require( 'matter-js' );
const Emitter = require( './emitter.js' );
const Vector = Matter.Vector;
const Bodies = Matter.Bodies;
const Sprite = PIXI.Sprite;
const Application = PIXI.Application;
const TilingSprite = PIXI.extras.TilingSprite;

// weakmap for private data (components array) accessible w/ prototype methods
const ComponentsMap = new WeakMap();

const EntityProto = Emitter( {
    'class': { value: 'Entity' },
    'id': { value: 0 },
    /**
     * Returns a copy of the components array from components map.
     * Will error if EntityProto is used directly.
     * The returned array is not modifiable, but the components inside are.
     */
    'components': {
        get: function() {
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

// weakmaps for private data (entities array and systems array) accessible w/ prototype methods
const EntitiesMap = new WeakMap();
const SystemsMap = new WeakMap();

const EngineProto = Emitter( {
    'class': { value: 'Engine' },
    'id': { value: 0 },
    'entities': {
        get: function() {
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
    },
    'addSystems': {
        value: function( ...additions ) {
            Array.prototype.push.apply( SystemsMap.get( this ), additions );
        }
    },
    'removeSystems': {
        value: function( ...subtractions ) {
            const systems = SystemsMap.get( this );
            const spliced = [];

            subtractions.forEach( system => {
                let index = systems.indexOf( system );
                if ( index >= 0 ) spliced.push( systems.splice( index, 1 )[ 0 ] );
            } );

            return spliced;
        }
    },
    'clearSystems': {
        value: function() {
            const systems = SystemsMap.get( this );
            return systems.splice( 0, systems.length );
        }
    },
    'update': {
        value: function() {
            const systems = SystemsMap.get( this );
            for ( let i = 0, l = systems.length; i < l; i++)
                systems[ i ].update();
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

const SystemProto = Emitter( {} );
const RenderSystem = function( view, scale ) {
    const system = {
        application: null,
        engine: null,
        init() {
            this.application = new Application(
                document.body.offsetWidth,
                document.body.offsetHeight,
                {
                    view: view,
                    backgroundColor: 0x25caff,
                    resolution: scale,
                    autoResize: true
                }
            )
        }
    }
}

const ComponentProto = Emitter( {
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
    /**
     * A component that stores a 2d position in a `Matter.Vector`
     */
    position( x, y ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'position',
            data: Vector.create( ~~x, ~~y )
        } );
    },
    /**
     * A component that stores an angle in radians
     */
    rotation( angle ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'rotation',
            data: ~~angle
        } );
    },
    /**
     * A component that stores a scalar float scale
     */
    scale( scale ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'scale',
            data: scale
        } );
    },
    /**
     * A component that stores a polygon object created from `Matter.Bodies`
     */
    polygon( vertices, options ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'polygon',
            data: Bodies.fromVertices( 0, 0, vertices, Object.assign( {}, options ) )
        } );
    },
    /**
     * A component that stores a rectangle object created from `Matter.Bodies`
     */
    rectangle( width, height, options ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'rectangle',
            data: Bodies.rectangle( 0, 0, ~~width, ~~height, Object.assign( {}, options ) )
        } );
    },
    /**
     * A component that stores a sprite object created from `PIXI.Sprite`
     */
    sprite( texture ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'sprite',
            data: new Sprite( texture )
        } );
    },
    /**
     * A component that stores a `PIXI.extras.TilingSprite`
     */
    tilingSprite( texture, width, height ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'tiling-sprite',
            data: new TilingSprite( texture, width, height )
        } );
    },
    /**
     * A component that stores an array of child `Entities`
     */
    children( children ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'children',
            data: Array.isArray( children ) ? children : []
        } );
    },
    /**
     * A component that stores a force as a direction and magnitude
     */
    force( direction, magnitude ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'force',
            data: {
                direction: direction,
                magnitude: magnitude
            }
        } );
    },
    /**
     * A component that stores a hex color
     */
    color( color ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'color',
            data: color
        } );
    },
    /**
     * A component that stores a name string
     */
    name( name ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'name',
            data: String( name )
        } );
    },
    /**
     * A component that stores a `HTMLCanvasElement`
     */
    canvas( canvas ) {
        return Object.assign( Object.create( ComponentProto ), {
            type: 'canvas',
            data: canvas instanceof HTMLCanvasElement ?
                            canvas : document.createElement( 'canvas' )
        } );
    }
};

module.exports = {
    Components: Components,
    Entity: Entity,
    Engine: Engine
};
