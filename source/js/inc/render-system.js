'use strict';

const ECS = require( './ecs.js' );
const Components = ECS.Components;
const System = ECS.System;

const RenderSystem = function( options ) {
    const App = options.App;

    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start();

                const entities = this.getEntities();

                // get visual and transform data and create a child for the `PIXI.application` stage
                // @TODO only handles Sprites. needs at support TilingSprite and other possibilities.
                // `multi` visuals will work as they'll be individual components
                entities.forEach( entity => {
                    // @TODO better entity api
                    const spriteComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Sprite ) ||
                        entity.components.find( component => Object.getPrototypeOf( component ) === Components.TilingSprite );
                    this.updateEntity( entity );
                    App.stage.addChild( spriteComponent.data );
                } );
                App.renderer.backgroundColor = options.backgroundColor;
                this.setListeners();
                App.ticker.add( this.update.bind( this ) );
            }
        },
        'update': {
            value: function() {
                // console.log('update');
                const entities = this.getEntities();
                entities.forEach( entity => this.updateEntity( entity ) );
            }
        },
        'updateEntity': {
            value: function( entity ) {
                // @TODO add querying functions to components so these don't need to be so long and messy.
                const spriteComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Sprite ) ||
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
                           ( entity.components.find( component => Object.getPrototypeOf( component ) === Components.Sprite ) ||
                             entity.components.find( component => Object.getPrototypeOf( component ) === Components.TilingSprite ) );
                } );

                return entities;
            }
        },
        'setListeners': {
            value: function() {
                window.addEventListener( 'resize', function() {
                    App.renderer.resize(
                        App.view.clientWidth * App.renderer.resolution,
                        App.view.clientHeight * App.renderer.resolution
                    );
                }, false );
            }
        }
    } );

    return system;
}

module.exports = RenderSystem;
