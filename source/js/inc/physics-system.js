'use strict';

const Matter = require( 'matter-js' );
const MatterAttractors = require( 'matter-attractors' );
const ECS = require( './ecs.js' );
const MatterForces = require( './matter-forces' );
const Util = require( './util' );

const Components = ECS.Components;
const System = ECS.System;

Matter.use( 'matter-forces' );

const PhysicsSystem = function( options ) {
    const world = Matter.World.create( {
        gravity: { x: 0, y: 0, scale: 0.001 }
    } );

    const engine = Matter.Engine.create( { world: world } );

    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start();
                const entities = this.getEntities();
                const environment = this.getEnvironment();

                entities.forEach( entity => {
                    const geometry = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Polygon ) ||
                           entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rectangle ) ||
                           entity.components.find( component => Object.getPrototypeOf( component ) === Components.Circle );
                    const positionComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                    const rotationComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );
                    const scaleComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Scale );
                    geometry.data.position.x = positionComponent.data.x;
                    geometry.data.position.y = positionComponent.data.y;
                    geometry.data.angle = rotationComponent.data;
                    Matter.World.add( engine.world, [ geometry.data ] );
                    this.updateEntity( entity, environment );
                } );
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
        'updateEntity': {
            value: function( entity, environment ) {
                const geometry = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Polygon ) ||
                               entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rectangle ) ||
                               entity.components.find( component => Object.getPrototypeOf( component ) === Components.Circle );
                const positionComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                const rotationComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );
                const scaleComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Scale );
                const forces = environment.components.filter( component => Object.getPrototypeOf( component ) === Components.Force );

                geometry.data.plugin.forces = [];
                forces.forEach( force => {
                    const forceVector = Util.angleToVector( Util.toRadians( force.data.direction ) );
                    geometry.data.plugin.forces.push( {
                        x: forceVector.x * force.data.magnitude,
                        y: forceVector.y * force.data.magnitude
                    } );
                } );

                positionComponent.data.x = geometry.data.position.x;
                positionComponent.data.y = geometry.data.position.y;
                rotationComponent.data = geometry.data.angle;
            }
        },
        'update': {
            value: function( delta ) {
                // console.log( 'update physics' );
                const entities = this.getEntities();
                const environment = this.getEnvironment();

                entities.forEach( entity => this.updateEntity( entity, environment ) );
                Matter.Engine.update( engine, delta );
            }
        },
        'getEnvironment': {
            value: function() {
                // finds the first environment entity
                const envFinder = e => {
                    return !!( e.components.find(
                        c => Object.getPrototypeOf( c ) === Components.Name &&
                        c.data === 'Environment' )
                    );
                };
                const environment = this.engine.entities.find( envFinder );
                return environment;
            }
        }
    } );

    return system;
}

module.exports = PhysicsSystem;
