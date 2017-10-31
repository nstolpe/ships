'use strict';

const PIXI = require( 'pixi.js' );
const Matter = require( 'matter-js' );
const Emitter = require( './emitter.js' );
const Vector = Matter.Vector;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
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
            const components = ComponentsMap.get( this );

            additions.forEach( component => {
                components.push( component )
                this.emit( 'component-added', component );
            } );
        }
    },
    'removeComponents': {
        value: function( ...subtractions ) {
            const components = ComponentsMap.get( this );
            const spliced = [];

            subtractions.forEach( component => {
                let index = components.indexOf( component );
                if ( index >= 0 ) {
                    spliced.push( components.splice( index, 1 )[ 0 ] );
                    this.emit( 'component-removed', component );
                }
            } );

            return spliced;
        }
    },
    'clearComponents': {
        value: function() {
            const components = ComponentsMap.get( this );
            this.emit( 'components-cleared' );
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
            const entities = EntitiesMap.get( this );

            additions.forEach( entity => {
                entities.push( entity );
                this.emit( 'entity-added', entity );
            } );
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
            this.emit( 'entities-cleared' );
            return entities.splice( 0, entities.length );
        }
    },
    'addSystems': {
        value: function( ...additions ) {
            const systems = SystemsMap.get( this );

            additions.forEach( system => {
                systems.push( system );
                system.engine = this;
                system.emit( 'added-to-engine', this );
                this.emit( 'system-added', system );
            } );
        }
    },
    'removeSystems': {
        value: function( ...subtractions ) {
            const systems = SystemsMap.get( this );
            const spliced = [];

            subtractions.forEach( system => {
                let index = systems.indexOf( system );
                if ( index >= 0 ) {
                    spliced.push( systems.splice( index, 1 )[ 0 ] );
                    system.emit( 'removed-from-engine', engine );
                    this.emit( 'system-removed', system );
                }
            } );

            return spliced;
        }
    },
    'clearSystems': {
        value: function() {
            const systems = SystemsMap.get( this );
            this.emit( 'systems-cleared' );
            return systems.splice( 0, systems.length );
        }
    },
    'update': {
        value: function( delta ) {
            const systems = SystemsMap.get( this );
            this.emit( 'update-start' );

            for ( let i = 0, l = systems.length; i < l; i++)
                systems[ i ].update( delta );

            this.emit( 'update-end' );
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
    SystemsMap.set( engine, [] );
    return engine;
}

/**
 * Prototype for systems. See RenderSystem for implementation.
 */
const System = Emitter( {
    'engine': {
        value: null,
        enumerable: true,
        writable: true
    },
    'started': {
        value: false,
        enumerable: true,
        writable: true
    },
    'update': {
        value: function() {
            this.emit( 'system-update', this );
        }
    },
    'start': {
        value: function() {
            this.started = true;
            this.emit( 'start' );
        }
    },
    'stop': {
        value: function() {
            this.started = false;
            this.emit( 'stop' );
        }
    }
} );

const Component = Object.create( Object.prototype, {
    'class': { value: 'Component' },
    'type': {
        value: 'component',
        enumerable: true,
        writable: true
    },
    'data': {
        value: 0,
        enumerable: true,
        writable: true
    },
    'create': {
        value: ( proto, data ) => {
            return Object.assign(
                Object.create( proto, {
                    'create': {
                        value: function() {
                            return proto.create.apply( proto, arguments );
                        },
                        configurable: false
                    }
                } ),
                { data: data }
            );
        },
        configurable: true
    }
} );

const Components ={
    /**
     * A component that stores a 2d position in a `Matter.Vector`
     */
    Position: Object.create( Component, {
        'create': {
            value: function( x, y ) {
                return Object.getPrototypeOf( this ).create( this, Vector.create( Number( x ), Number( y ) ) );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores an angle in radians
     */
    Rotation: Object.create( Component, {
        'create': {
            value: function( angle ) {
                return Object.getPrototypeOf( this ).create( this, Number( angle ) );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a scalar float scale
     */
     Scale: Object.create( Component, {
        'create': {
            value: function( scale ) {
                return Object.getPrototypeOf( this ).create( this, Number( scale ) );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a polygon object created from `Matter.Bodies`
     */
    Polygon: Object.create( Component, {
        'create': {
            value: function( vertices, options ) {
                return Object.getPrototypeOf( this ).create(
                    this,
                    Bodies.fromVertices( 0, 0, vertices, Object.assign( {}, options ) )
                );
            },
            configurable: false
        }
    } ),
    CompoundBody: Object.create( Component, {
        'create': {
            value: function( parts, options ) {
                return Object.getPrototypeOf( this ).create(
                    this,
                    Body.create( Object.assign( { parts: parts }, options ) )
                );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a rectangle object created from `Matter.Bodies`
     */
    Rectangle: Object.create( Component, {
        'create': {
            value: function( width, height, options ) {
                return Object.getPrototypeOf( this ).create(
                    this,
                    Bodies.rectangle( 0, 0, Number( width ), Number( height ), Object.assign( {}, options ) )
                );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a sprite object created from `PIXI.Sprite`
     */
    Sprite: Object.create( Component, {
        'create': {
            value: function( texture ) {
                return Object.getPrototypeOf( this ).create( this, new Sprite( texture ) );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a `PIXI.extras.TilingSprite`
     */
    TilingSprite: Object.create( Component, {
        'create': {
            value: function( texture, width, height ) {
                return Object.getPrototypeOf( this ).create( this, new TilingSprite( texture, width, height ) );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores an array of child `Entities`
     */
    Children: Object.create( Component, {
        'create': {
            value: function( children ) {
                return Object.getPrototypeOf( this ).create( this, Array.isArray( children ) ? children : [] );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a force as a direction and magnitude
     */
    Force: Object.create( Component, {
        'create': {
            value: function( direction, magnitude ) {
                return Object.getPrototypeOf( this ).create( this, { direction: Number( direction ), magnitude: Number( magnitude ) } );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a hex color
     */
    Color: Object.create( Component, {
        'create': {
            value: function( color ) {
                return Object.getPrototypeOf( this ).create( this, parseInt( color, 16 ) );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a name string
     */
    Name: Object.create( Component, {
        'create': {
            value: function( name ) {
                return Object.getPrototypeOf( this ).create( this, String( name ) );
            },
            configurable: false
        }
    } )
};

module.exports = {
    Components: Components,
    Entity: Entity,
    Engine: Engine,
    System: System
};
