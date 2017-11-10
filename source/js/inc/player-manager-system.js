'use strict';

const Matter = require( 'matter-js' );

const ECS = require( './ecs.js' );
const Components = ECS.Components;
const System = ECS.System;

const Forces = {
    thrust: 0,
    rotation: 0
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
                // if ( Forces.rotation || Forces.thrust ) {
                    const player = this.getEntities()[0];
                    const geometryComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Polygon ) ||
                           player.components.find( component => Object.getPrototypeOf( component ) === Components.CompoundBody ) ||
                           player.components.find( component => Object.getPrototypeOf( component ) === Components.Rectangle ) ||
                           player.components.find( component => Object.getPrototypeOf( component ) === Components.Circle );
                    const positionComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                    const rotationComponent = player.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );
                // }

                if ( Forces.thrust ) {
                        let vec = Matter.Vector.create(
                            Math.cos( rotationComponent.data ),
                            Math.sin( rotationComponent.data )
                        );
                        vec = Matter.Vector.normalise( vec );
                        vec = Matter.Vector.mult( vec, Forces.thrust );
                        Matter.Body.applyForce( geometryComponent.data, positionComponent.data, vec );
                }

                if ( Forces.rotation )
                    geometryComponent.data.torque = Forces.rotation;
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
                switch ( message.type ) {
                    case 'player-input-thrust':
                        Forces.thrust = message.data;
                        break;
                    case 'player-input-turn':
                        Forces.rotation = message.data;
                        break;
                }
            }
        }
    } );

    return system;
}

module.exports = PlayerManagerSystem;
