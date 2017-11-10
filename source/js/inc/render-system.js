'use strict';

const ECS = require( './ecs.js' );
const Components = ECS.Components;
const System = ECS.System;

/**
 * @param {object} options                  Key/value set of options
 * @param {object} options.app              PIXI.application instance
 * @param {object} options.backgroundColor  ECS.Components.Color instance
 * @param {object} options.hub              Turms.Hub instance
 */
const RenderSystem = function( options ) {
    const App = options.app;
    const graphics = options.graphics;
    const hub = options.hub;
    App.renderer.backgroundColor = options.backgroundColor == null ? 0x000000 : options.backgroundColor;

    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start();

                const entities = this.getEntities();

                // get visual and transform data and create a child for the `PIXI.application` stage
                // @TODO only handles Sprites. needs at support TilingSprite and other possibilities.
                // `compound` visuals will work as they'll be individual components
                entities.forEach( entity => {
                    // @TODO better entity api
                    const spriteComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Container ) ||
                        entity.components.find( component => Object.getPrototypeOf( component ) === Components.Sprite ) ||
                        entity.components.find( component => Object.getPrototypeOf( component ) === Components.TilingSprite );

                    if ( !entity.components.find( component => Object.getPrototypeOf( component ) === Components.Parent ) )
                        this.updateEntity( entity );

                    App.stage.addChild( spriteComponent.data );
                } );

                App.stage.addChild( graphics );
                if ( typeof hub === 'object' )
                    this.registerSubscriptions();

                App.ticker.add( this.update.bind( this ) );
            }
        },
        /**
         * Resizes the canvas if its `clientWidth` doesn't equal it's `width` or if its
         * `clientHeight` doesn't equal its `height`
         */
        'resize': {
            value: function() {
                if ( App.view.width != App.view.clientWidth || App.view.height !== App.view.clientHeight ) {
                    App.renderer.resize(
                        App.view.clientWidth * App.renderer.resolution,
                        App.view.clientHeight * App.renderer.resolution
                    );
                }
            }
        },
        'update': {
            value: function( delta ) {
                // console.log('update render');
                const entities = this.getEntities();

                this.resize();

                entities.forEach( entity => this.updateEntity( entity ) );

                graphics.clear();

                entities.forEach( entity => {
                    const geometryComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Polygon ) ||
                        entity.components.find( component => Object.getPrototypeOf( component ) === Components.CompoundBody ) ||
                        entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rectangle ) ||
                        entity.components.find( component => Object.getPrototypeOf( component ) === Components.Circle );

                        switch ( true ) {
                            case Object.getPrototypeOf( geometryComponent ) === Components.Rectangle:
                            case Object.getPrototypeOf( geometryComponent ) === Components.Polygon:
                                graphics.lineStyle( 1, 0xff00ff, 1 );
                                geometryComponent.data.vertices.forEach( ( vertex, idx, vertices ) => {
                                    switch ( idx ) {
                                        case 0:
                                            graphics.moveTo( vertex.x, vertex.y );
                                            break;
                                        case vertices.length - 1:
                                            graphics.lineTo( vertex.x,vertex.y );
                                            graphics.lineTo( vertices[ 0 ].x, vertices[ 0 ].y );
                                            break;
                                        default:
                                            graphics.lineTo( vertex.x,vertex.y );
                                            break;
                                    }
                                } );
                                break;
                            case Object.getPrototypeOf( geometryComponent ) === Components.Circle:
                            case Object.getPrototypeOf( geometryComponent ) === Components.Container:
                            defaut:
                                break;
                        }
                } );
            }
        },
        'updateEntity': {
            value: function( entity ) {
                // @TODO add querying functions to components so these don't need to be so long and messy.
                const spriteComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Container ) ||
                    entity.components.find( component => Object.getPrototypeOf( component ) === Components.Sprite ) ||
                    entity.components.find( component => Object.getPrototypeOf( component ) === Components.TilingSprite );
                const positionComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                const rotationComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );
                const scaleComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Scale );

                spriteComponent.data.position.x = positionComponent.data.x;
                spriteComponent.data.position.y = positionComponent.data.y;
                spriteComponent.data.rotation = rotationComponent.data;
                spriteComponent.data.scale.x = scaleComponent.data;
                spriteComponent.data.scale.y = scaleComponent.data;
                spriteComponent.data.pivot.set( spriteComponent.data.width * 0.5, spriteComponent.data.height * 0.5 );
            }
        },
        'getEntities': {
            value: function() {
                const entities = this.engine.entities.filter( entity => {
                    return entity.components.find( component => Object.getPrototypeOf( component ) === Components.Position ) &&
                           entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation ) &&
                           entity.components.find( component => Object.getPrototypeOf( component ) === Components.Scale ) &&
                           ( entity.components.find( component => Object.getPrototypeOf( component ) === Components.Container ) ||
                             entity.components.find( component => Object.getPrototypeOf( component ) === Components.Sprite ) ||
                             entity.components.find( component => Object.getPrototypeOf( component ) === Components.TilingSprite ) );
                } );

                return entities;
            }
        },
        'registerSubscriptions': {
            value: function() {
                hub.addSubscription( this, 'get-renderable-entities' );
            }
        },
        'receiveMessage': {
            value: function( action, message ) {
                switch ( message.type ) {
                    case 'get-renderable-entities':
                        hub.sendMessage( {
                            type: 'renderable-entities',
                            data: this.getEntities
                        } );
                        break;
                    default:
                        break;
                }
            }
        }
    } );

    return system;
}

module.exports = RenderSystem;
