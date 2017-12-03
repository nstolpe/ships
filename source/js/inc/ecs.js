'use strict';

const PIXI = require( 'pixi.js' );
const Matter = require( 'matter-js' );
const Emitter = require( './emitter.js' );
const Util = require( './util.js' );

const Vector = Matter.Vector;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Constraint = Matter.Constraint;
const Container = PIXI.Container;
const Application = PIXI.Application;

// weakmap for private data (components array) accessible w/ prototype methods
const ComponentsMap = new WeakMap();

const EntityProto = Emitter( {
    'class': { value: 'Entity' },
    'id': { value: 0 },
    'data': {
        value: {},
        enumerable: true,
        writable: true
    },
    'flatten': {
        value: function() {
            const componentKeys = Object.keys( Components );
            const flat = {};

            // store each component on flat with its prototype name as key
            this.components.forEach( component => {
                const componentKey = componentKeys.find( key => Components[ key ].isPrototypeOf( component ) );
                flat[ componentKey ] = component;
            } );

            this.data = flat;
        }
    },
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

            this.flatten();
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

            this.flatten();
            return spliced;
        }
    },
    'clearComponents': {
        value: function() {
            const components = ComponentsMap.get( this );
            components.splice( 0, components.length );
            this.flatten();
            this.emit( 'components-cleared' );
            return components;
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
    entity.flatten();
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
    },
    'is': {
        value: function( proto ) {
            return Object.getPrototypeOf( this ) === proto;
        }
    }
} );

const Components = {
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
     * A component that stores a float alpha clamped between 0 and 1
     */
    Alpha: Object.create( Component, {
        'create': {
            value: function( alpha ) {
                alpha = Util.isNumeric( alpha ) ? parseFloat( alpha ) : 1;
                return Object.getPrototypeOf( this ).create( this, Util.clamp( alpha, 0, 1 ) );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores an int tint clamped between 0x000000 and 0xffffff
     */
    Tint: Object.create( Component, {
        'create': {
            value: function( tint ) {
                tint = !Util.isNumeric( tint ) ? 0xffffff : Number.isInteger( tint ) ? tint : parseInt( tint, 16 );
                return Object.getPrototypeOf( this ).create( this, Util.clamp( tint, 0x000000, 0xffffff ) );
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
     * A component that stores a circle object created from `Matter.Bodies`
     */
    Circle: Object.create( Component, {
        'create': {
            value: function( radius, options ) {
                return Object.getPrototypeOf( this ).create(
                    this,
                    Bodies.circle( 0, 0, Number( radius ), Object.assign( {}, options ) )
                );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a constraint object created from `Matter.Constraint`
     */
    Constraint: Object.create( Component, {
        'create': {
            value: function( options ) {
                return Object.getPrototypeOf( this ).create(
                    this,
                    Constraint.create( options )
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
                return Object.getPrototypeOf( this ).create( this, new PIXI.Sprite( texture ) );
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
                return Object.getPrototypeOf( this ).create( this, new PIXI.extras.TilingSprite( texture, width, height ) );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a `PIXI.Graphics`
     */
    Graphics: Object.create( Component, {
        'create': {
            value: function() {
                return Object.getPrototypeOf( this ).create( this, new PIXI.Graphics() );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a `PIXI.Container`
     */
    Container: Object.create( Component, {
        'create': {
            value: function() {
                return Object.getPrototypeOf( this ).create( this, new Container() );
            },
            configurable: false
        }
    } ),
    /**
     * A component that stores a parent `Entity`
     */
    Parent: Object.create( Component, {
        'create': {
            value: function( parent ) {
                return Object.getPrototypeOf( this ).create( this, parent );
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
    } ),
    /**
     * A component that stores a manager
     */
    PlayerManager: Object.create( Component, {
        'create': {
            value: function() {
                return Object.getPrototypeOf( this ).create( this, true );
            },
            configurable: false
        }
    } ),
    Stroke: Object.create( Component, {
        'create': {
            value: function( color, width ) {
                return Object.getPrototypeOf( this ).create( this, { color: color, width: width } );
            },
            configurable: false
        }
    } ),
    Fill: Object.create( Component, {
        'create': {
            value: function( color ) {
                return Object.getPrototypeOf( this ).create( this, color );
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
