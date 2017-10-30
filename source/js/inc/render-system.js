'use strict';

const ECS = require( './ecs.js' );
const Components = ECS.Components;
const System = ECS.System;

const RenderSystem = function() {
    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start();

                const entities = this.getEntities();
                let PIXIAppComponent;
                const PIXIAppEntity = this.engine.entities.find( entity => {
                    PIXIAppComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.PIXIApp );
                    return PIXIAppComponent;
                } );
                // @TODO this window listener needs to move.
                window.addEventListener( 'resize', function() {
                    PIXIAppComponent.data.renderer.resize(
                        PIXIAppComponent.data.view.clientWidth * PIXIAppComponent.data.renderer.resolution,
                        PIXIAppComponent.data.view.clientHeight * PIXIAppComponent.data.renderer.resolution
                    );
                }, false );
                // get visual and transform data and create a child for the `PIXI.application` stage
                // @TODO only handles Sprites. needs at support TilingSprite and other possibilities.
                // `multi` visuals will work as they'll be individual components
                entities.forEach( entity => {
                    const spriteComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Sprite );
                    const tilingSpriteComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.TilingSprite );
                    const positionComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                    const rotationComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );
                    const scaleComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Scale );

                    if ( spriteComponent ) {
                        spriteComponent.data.position.x = positionComponent.data.x;
                        spriteComponent.data.position.y = positionComponent.data.y;
                        spriteComponent.data.rotation = rotationComponent.data;
                        spriteComponent.data.scale.x = scaleComponent.data;
                        spriteComponent.data.scale.y = scaleComponent.data;
                        spriteComponent.data.pivot.set( spriteComponent.data.width * 0.5, spriteComponent.data.height * 0.5 );
                        PIXIAppComponent.data.stage.addChild( spriteComponent.data );
                    } else if ( tilingSpriteComponent ) {
                        tilingSpriteComponent.data.position.x = positionComponent.data.x;
                        tilingSpriteComponent.data.position.y = positionComponent.data.y;
                        tilingSpriteComponent.data.rotation = rotationComponent.data;
                        tilingSpriteComponent.data.scale.x = scaleComponent.data;
                        tilingSpriteComponent.data.scale.y = scaleComponent.data;
                        tilingSpriteComponent.data.pivot.set( tilingSpriteComponent.data.width * 0.5, tilingSpriteComponent.data.height * 0.5 );
                        PIXIAppComponent.data.stage.addChild( tilingSpriteComponent.data );
                    }
                } );
            }
        },
        'update': {
            value: function() {
                const entities = this.getEntities();
                console.log( entities );
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
        }
    } );

    return system;
}

module.exports = RenderSystem;
