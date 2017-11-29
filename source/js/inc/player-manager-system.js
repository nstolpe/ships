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
                const geometryComponent = player.components.find( component => {
                    return component.is( Components.Polygon ) ||
                    component.is( Components.CompoundBody ) ||
                    component.is( Components.Rectangle ) ||
                    component.is( Components.Circle );
                } );
                const positionComponent = player.components.find( component => component.is( Components.Position ) );
                const rotationComponent = player.components.find( component => component.is( Components.Rotation ) );

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
                    return entity.components.find( component => component.is( Components.PlayerManager ) );
                } );
                return entities;
            }
        },
        'registerSubscriptions': {
            value: function() {
                hub.addSubscription( this, 'player-input-thrust' );
                hub.addSubscription( this, 'player-input-turn' );
                hub.addSubscription( this, 'player-input-boost' );
                hub.addSubscription( this, 'collision-start' );
                hub.addSubscription( this, 'collision-end' );
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
                    case 'collision-start':
                        if ( ( message.data.bodyA.collisionFilter.category === 0x000002 && message.data.bodyB.collisionFilter.category === 0x000020 ) ||
                            ( message.data.bodyB.collisionFilter.category === 0x000002 && message.data.bodyA.collisionFilter.category === 0x000020 ) ) {
                            console.log( 'enabling whatever this enables' );
                        }
                        break;
                    case 'collision-end':
                        if ( ( message.data.bodyA.collisionFilter.category === 0x000002 && message.data.bodyB.collisionFilter.category === 0x000020 ) ||
                            ( message.data.bodyB.collisionFilter.category === 0x000002 && message.data.bodyA.collisionFilter.category === 0x000020 ) ) {
                            console.log( 'disabling whatever this enables' );
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

module.exports = PlayerManagerSystem;
