'use strict';

const Matter = require( 'matter-js' );

const ECS = require( './ecs.js' );
const Components = ECS.Components;
const System = ECS.System;

const PlayerManagerSystem = function( options ) {
    const hub = options.hub;

    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start();
                this.registerSubscriptions();
            },
        },
        'update': {
            value: function( delta ) {

            }
        },
        'getEntities': {
            value: function() {
                const entities = this.engine.entities.filter( entity => {
                    return entity.components.find( component => Object.getPrototypeOf( component ) === Components.PlayerManager );
                } );
                return entities;
            }
        },
        'registerSubscriptions': {
            value: function() {
                hub.addSubscription( this, 'player-input-thrust' );
                hub.addSubscription( this, 'player-input-turn' );
            }
        },
        'receiveMessage': {
            value: function( action, message ) {
                const player = this.getEntities()[0];
                const geometryComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Polygon ) ||
                       player.components.find( component => Object.getPrototypeOf( component ) === Components.CompoundBody ) ||
                       player.components.find( component => Object.getPrototypeOf( component ) === Components.Rectangle ) ||
                       player.components.find( component => Object.getPrototypeOf( component ) === Components.Circle );
                const positionComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                const rotationComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );

                switch ( message.type ) {
                    case 'player-input-thrust':
                        console.log(geometryComponent.data.velocity)
                        let vec = Matter.Vector.create(
                            Math.cos( rotationComponent.data ),
                            Math.sin( rotationComponent.data )
                        );
                        vec = Matter.Vector.normalise( vec );
                        vec = Matter.Vector.mult( vec, message.data );
                        Matter.Body.applyForce( geometryComponent.data, positionComponent.data, vec );
                        break;
                    case 'player-input-turn':
                        geometryComponent.data.torque = message.data * 10;
                        break;
                }
            }
        }
    } );

    return system;
}

module.exports = PlayerManagerSystem;
