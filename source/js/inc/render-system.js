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
    let App = options.app;
    let graphics = options.graphics;
    let hub = options.hub;
    let debug = !!options.debug;
    let renderables;
    let player;
    let constraints;

    App.renderer.backgroundColor = options.backgroundColor == null ? 0x000000 : options.backgroundColor;

    const system = Object.create( System, {
        'debug': {
            set( value ) {
                debug = !!value;
            },
            get() {
                return debug;
            }
        },
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start();

                const renderables = this.getRenderables();
                const player = this.getPlayer();

                // get visual and transform data and create a child for the `PIXI.application` stage
                // @TODO only handles Sprites. needs at support TilingSprite and other possibilities.
                // `compound` visuals will work as they'll be individual components
                renderables.forEach( renderable => {
                    // @TODO better entity api
                    const spriteComponent = renderable.components.find( component => component.is( Components.Container ) ) ||
                        renderable.components.find( component => component.is( Components.Sprite ) ) ||
                        renderable.components.find( component => component.is( Components.TilingSprite ) );

                    spriteComponent.data.pivot.set( spriteComponent.data.width * 0.5, spriteComponent.data.height * 0.5 );

                    if ( !renderable.components.find( component => component.is( Components.Parent ) ) )
                        this.updateRenderable( renderable );

                    App.stage.addChild( spriteComponent.data );
                } );

                App.stage.addChild( graphics );

                // Set stage to player position
                if ( player ) {
                    const positionComponent = player.components.find( component => component.is( Components.Position ) );
                    if ( positionComponent ) {
                        App.stage.position.x = ( App.renderer.width / App.renderer.resolution ) / 2;
                        App.stage.position.y = ( App.renderer.height / App.renderer.resolution ) / 2;
                        App.stage.pivot.x = positionComponent.data.x;
                        App.stage.pivot.y = positionComponent.data.y;
                    }
                }
                // better checking?
                if ( typeof hub === 'object' )
                    this.registerSubscriptions();

                // App.ticker.add( this.update.bind( this ) );
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
                const renderables = this.getRenderables();

                this.resize();

                renderables.forEach( renderable => this.updateRenderable( renderable ) );

                // keeps the camera centerd on the player
                const player = this.getPlayer();
                const positionComponent = player.components.find( component => component.is( Components.Position ) );
                App.stage.pivot.x = positionComponent.data.x;
                App.stage.pivot.y = positionComponent.data.y;


                // @TODO draw anything, besides debug, that needs to be drawn by graphics
                // @TODO generate graphics if it's not there
                if ( typeof graphics.clear === 'function' ) {
                    graphics.clear();
                    if ( this.debug )
                        this.drawDebug( renderables );
                }
            }
        },
        'updateRenderable': {
            value: function( renderable ) {
                const geometryComponent =
                    renderable.data.Polygon ||
                    renderable.data.CompoundBody ||
                    renderable.data.Rectangle ||
                    renderable.data.Circle;
                const spriteComponent =
                    renderable.data.TilingSprite ||
                    renderable.data.Container ||
                    renderable.data.Sprite;
                const parentComponent = renderable.data.Parent;

                    // not sure why, but outlines don't match up to sprite (so physics and sprite are off too)
                    // if the position Component is used here. so using geometryCompment instead
                    // rotation Component is needed though, value from geometry gets weird.
                    spriteComponent.data.position.x = geometryComponent.data.position.x;
                    spriteComponent.data.position.y = geometryComponent.data.position.y;
                    spriteComponent.data.scale.x = renderable.data.Scale.data;
                    spriteComponent.data.scale.y = renderable.data.Scale.data;
                    spriteComponent.data.alpha = renderable.data.Alpha.data;
                    spriteComponent.data.tint = renderable.data.Tint.data;

                    // rotation updates should come from parent geometry if this is a child renderable/component
                    if ( parentComponent ) {
                        const parent = parentComponent.data;
                        spriteComponent.data.rotation = parent.data.Rotation.data;
                    } else {
                        spriteComponent.data.rotation = renderable.data.Rotation.data;
                    }
            }
        },
        'getRenderables': {
            value: function() {
                if ( !renderables ) {
                    renderables = this.engine.entities.filter( entity => {
                        return entity.components.find( component => component.is( Components.Position ) ) &&
                               entity.components.find( component => component.is( Components.Rotation ) ) &&
                               entity.components.find( component => component.is( Components.Scale ) ) &&
                               ( entity.components.find( component => component.is( Components.Container ) ) ||
                                 entity.components.find( component => component.is( Components.Sprite ) ) ||
                                 entity.components.find( component => component.is( Components.TilingSprite ) ) );
                    } );
                }

                return renderables;
            }
        },
        'getConstraints': {
            value: function() {
                if ( !constraints )
                    constraints = this.engine.entities.filter( entity => !!entity.data.Constraint );
                return constraints;
            }
        },
        'getPlayer': {
            value: function() {
                if ( !player ) {
                    player = this.getRenderables().find( entity => {
                        return entity.components.find( component => component.is( Components.PlayerManager ) );
                    } );
                }

                return player;
            }
        },
        'drawDebug': {
            value: function( entities ) {
                // Draws bounding shapes.
                entities.forEach( entity => {
                    const geometryComponent = entity.components.find( component => component.is( Components.Polygon ) ) ||
                        entity.components.find( component => component.is( Components.CompoundBody ) ) ||
                        entity.components.find( component => component.is( Components.Rectangle ) ) ||
                        entity.components.find( component => component.is( Components.Circle ) );

                        switch ( true ) {
                            case geometryComponent.is( Components.Rectangle ):
                            case geometryComponent.is( Components.Polygon ):
                                graphics.lineStyle( 1, 0x9dffb7, 1 );
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
                            case geometryComponent.is( Components.Circle ):
                                graphics.lineStyle( 1, 0x9dffb7, 1 );
                                graphics.drawCircle(
                                    geometryComponent.data.position.x,
                                    geometryComponent.data.position.y,
                                    geometryComponent.data.circleRadius
                                );
                                break;
                            case geometryComponent.is( Components.Container ):
                            defaut:
                                break;
                        }
                } );

                graphics.lineStyle( 1, 0xff0000, 1 );

                this.getConstraints().forEach( constraintEntity => {
                    let constraint = constraintEntity.data.Constraint.data;
                    if ( constraint.bodyA ) {
                        graphics.moveTo( constraint.bodyA.position.x + constraint.pointA.x, constraint.bodyA.position.y + constraint.pointA.y );
                    } else {
                        graphics.moveTo( constraint.pointA.x, constraint.pointA.y );
                    }
                    if ( constraint.bodyB ) {
                        graphics.lineTo( constraint.bodyB.position.x + constraint.pointB.x, constraint.bodyB.position.y + constraint.pointB.y );
                    } else {
                        graphics.lineTo( constraint.pointB.x, constraint.pointB.y );
                    }
                } );
            }
        },
        'registerSubscriptions': {
            value: function() {
                hub.addSubscription( this, 'get-renderable-entities' );
                hub.addSubscription( this, 'zoom' );
                hub.addSubscription( this, 'collision-start' );
                hub.addSubscription( this, 'collision-end' );
            }
        },
        'receiveMessage': {
            // action will probably be deprecated in turms.
            value: function( action, message ) {
                switch ( message.type ) {
                    // returns renderable entities. unused.
                    case 'get-renderable-entities':
                        hub.sendMessage( {
                            type: 'renderable-entities',
                            data: this.getRenderables
                        } );
                        break;
                    // handles zoom
                    // scale locked at .25 and 2.5. @TODO make configurable
                    case 'zoom':
                        let scale = App.stage.scale.x + message.data;
                        if ( scale > 2.5 ) scale = 2.5;
                        if ( scale < .25 ) scale = .25;

                        App.stage.scale.set( scale, scale );
                        break;
                    case 'collision-start':
                        // this is better than checking the labels, but these hex numbers should be stored somewhere
                        if ( ( message.data.bodyA.collisionFilter.category === 0x000002 && message.data.bodyB.collisionFilter.category === 0x000020 ) ||
                            ( message.data.bodyB.collisionFilter.category === 0x000002 && message.data.bodyA.collisionFilter.category === 0x000020 ) ) {
                            let target;
                            let spriteComponent;

                            if ( message.data.bodyA.label === 'player' )
                                target = this.engine.entities.find( entity => entity.data.Name.data === message.data.bodyB.label );
                            else
                                target = this.engine.entities.find( entity => entity.data.Name.data === message.data.bodyA.label );

                            spriteComponent =
                                target.data.TilingSprite ||
                                target.data.Container ||
                                target.data.Sprite;

                            // spriteComponent.data.alpha = 0.5;
                            target.data.Alpha.data = 0.5;
                        }
                        break;
                    case 'collision-end':
                        if ( ( message.data.bodyA.collisionFilter.category === 0x000002 && message.data.bodyB.collisionFilter.category === 0x000020 ) ||
                            ( message.data.bodyB.collisionFilter.category === 0x000002 && message.data.bodyA.collisionFilter.category === 0x000020 ) ) {
                            let target;
                            let spriteComponent;

                            if ( message.data.bodyA.label === 'player' )
                                target = this.engine.entities.find( entity => entity.data.Name.data === message.data.bodyB.label );
                            else
                                target = this.engine.entities.find( entity => entity.data.Name.data === message.data.bodyA.label );

                            spriteComponent =
                                target.data.TilingSprite ||
                                target.data.Container ||
                                target.data.Sprite;

                            // spriteComponent.data.alpha = 0.25;
                            target.data.Alpha.data = 0.25;
                        }
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
