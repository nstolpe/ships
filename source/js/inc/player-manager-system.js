'use strict';

const Matter = require( 'matter-js' );

const ECS = require( './ecs.js' );
const Components = ECS.Components;
const System = ECS.System;

const Forces = {
    thrust: 0,
    torque: 0,
    boost: 0
};

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
                const player = this.getEntities()[0];
                const geometryComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Polygon ) ||
                       player.components.find( component => Object.getPrototypeOf( component ) === Components.CompoundBody ) ||
                       player.components.find( component => Object.getPrototypeOf( component ) === Components.Rectangle ) ||
                       player.components.find( component => Object.getPrototypeOf( component ) === Components.Circle );
                const positionComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                const rotationComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );

                if ( Forces.thrust || Forces.boost ) {
                        // get rotation as vector
                        let vec = Matter.Vector.create(
                            Math.cos( rotationComponent.data ),
                            Math.sin( rotationComponent.data )
                        );
                        // normalize rotation/direction
                        vec = Matter.Vector.normalise( vec );

                        if ( Forces.thrust ) {
                            Matter.Body.applyForce(
                                geometryComponent.data,
                                positionComponent.data,
                                Matter.Vector.mult( vec, Forces.thrust )
                            );
                        }

                        if ( Forces.boost ) {
                            Matter.Body.applyForce(
                                geometryComponent.data,
                                positionComponent.data,
                                Matter.Vector.mult( vec, Forces.boost )
                            );
                            Forces.boost = 0;
                        }
                }

                if ( Forces.torque ) {
                    geometryComponent.data.torque = Forces.torque;
                }
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
                hub.addSubscription( this, 'player-input-boost' );
            }
        },
        'receiveMessage': {
            value: function( action, message ) {
                switch ( message.type ) {
                    case 'player-input-thrust':
                        Forces.thrust = message.data;
                        break;
                    case 'player-input-turn':
                        Forces.torque = message.data;
                        break;
                    case 'player-input-boost':
                        Forces.boost = message.data;
                        break;
                }
            }
        }
    } );

    return system;
}

module.exports = PlayerManagerSystem;
