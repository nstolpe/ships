'use strict';

const Matter = require( 'matter-js' );
const MatterAttractors = require( 'matter-attractors' );
const ECS = require( './ecs.js' );
const MatterForces = require( './matter-forces' );

const Components = ECS.Components;
const System = ECS.System;

Matter.use( 'matter-forces' );

var world = Matter.World.create( {
    gravity: { x: 0, y: 0, scale: 0.001 }
} );

var engine = Matter.Engine.create( { world: world } );

const PhysicsSystem = function( options ) {
    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start();
                const entities = this.getEntities();
            }
        },
        'getEntities': {
            value: function() {
                const entities = this.engine.entities.filter( entity => {
                    return entity.components.find( component => Object.getPrototypeOf( component ) === Components.Polygon ) ||
                           entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rectangle ) ||
                           entity.components.find( component => Object.getPrototypeOf( component ) === Components.Circle );
                } );

                return entities;
            }
        },
    } );

    return system;
}

module.exports = PhysicsSystem;
