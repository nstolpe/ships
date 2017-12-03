'use strict';

const Matter = require( 'matter-js' );

const ECS = require( './ecs.js' );
const Util = require( './util.js' );
const Components = ECS.Components;
const System = ECS.System;

const Forces = {
    thrust: 0,
    torque: 0,
    boost: 0
};

const PlayerManagerSystem = function( options ) {
    const hub = options.hub;

    let targetOverlaid = {
        actor: undefined,
        target: undefined,
        set( actor, target ) {
            this.actor = actor;
            this.target = target;
        },
        reset() {
            this.actor = undefined;
            this.target = undefined;
        },
        active() {
            return this.actor != undefined && this.target != undefined;
        }
    };

    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start.call( this );
                this.registerSubscriptions();
            },
        },
        'update': {
            // This logic should move out of here, and player-manager-system could probably lose update.
            // add the forces and torque below to the plugin data of the geometry instead, have matter plugin add all together.
            // Add those forces to plugin data in message/event handler.
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
                // @TODO collision doesn't belong here. RenderSystem should handle it graphics changes.
                hub.addSubscription( this, 'collision-start' );
                hub.addSubscription( this, 'collision-end' );
                hub.addSubscription( this, 'player-input-dock' );
            }
        },
        'receiveMessage': {
            value: function( action, message ) {
                const actorCategory = 0x000002;
                const targetCategory = 0x000020;
                let actor;
                let target;
                let categoryA;
                let categoryB;

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
                    // @TODO everything else in here handles player input. collision should move out.
                    // another system (collision-system) should listen to collision, then send events about/with actor-target.
                    // if actor is player, enable interaction input. Do targetCategory/actorCategory stuff there.
                    // Can do stuff with other collision types there too.
                    case 'collision-start':
                        categoryA = Util.property( message.data, 'bodyA.collisionFilter.category' );
                        categoryB = Util.property( message.data, 'bodyB.collisionFilter.category' );

                        const hasGeometry = ( data, body) => {
                            return Util.property( data, 'Polygon.data' ) === body ||
                                Util.property( data, 'CompoundBody.data' ) === body ||
                                Util.property( data, 'Rectangle.data' ) === body ||
                                Util.property( data, 'Circle.data' ) === body
                        }

                        if ( ( categoryA === actorCategory && categoryB === targetCategory ) ||
                            ( categoryB === actorCategory && categoryA === targetCategory ) ) {

                            if ( categoryA === actorCategory ) {
                                actor = this.engine.entities.find( e => {
                                    const body = Util.property( message.data, 'bodyA' );
                                    return hasGeometry( e.data, body );
                                } );
                                target = this.engine.entities.find( e => {
                                    const body = Util.property( message.data, 'bodyB' );
                                    return hasGeometry( e.data, body );
                                } );
                            } else {
                                actor = this.engine.entities.find( e => {
                                    const body = Util.property( message.data, 'bodyA' );
                                    return hasGeometry( e.data, body );
                                } );
                                target = this.engine.entities.find( e => {
                                    const body = Util.property( message.data, 'bodyB' );
                                    return hasGeometry( e.data, body );
                                } );
                            }

                            targetOverlaid.set( actor, target );
                        }
                        break;
                    case 'collision-end':
                        categoryA = Util.property( message, 'data.bodyA.collisionFilter.category' );
                        categoryB = Util.property( message, 'data.bodyB.collisionFilter.category' );

                        if ( ( categoryA === actorCategory && categoryB === targetCategory ) ||
                            ( categoryB === actorCategory && categoryA === targetCategory ) ) {
                            targetOverlaid.reset();
                        }
                        break;
                    case 'player-input-dock':
                        if ( targetOverlaid.active() ) {
                            console.log( targetOverlaid );
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
