'use strict';

const Matter = require( 'matter-js' );
// const MatterAttractors = require( 'matter-attractors' );
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
                    Matter.Body.setPosition( geometry.data, positionComponent.data );
                    Matter.Body.setAngle( geometry.data, rotationComponent.data );
                    Matter.Body.scale( geometry.data, scaleComponent.data, scaleComponent.data );
                    Matter.World.add( engine.world, [ geometry.data ] );
                    this.updateEntity( entity, environment );
                } );

                // Matter.Engine.run( engine );
                // Matter.Events.on( engine, 'afterUpdate', this.update.bind( this ) );
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
                const geometryComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Polygon ) ||
                               entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rectangle ) ||
                               entity.components.find( component => Object.getPrototypeOf( component ) === Components.Circle );
                const positionComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                const rotationComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );
                const scaleComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Scale );
                const forces = environment.components.filter( component => Object.getPrototypeOf( component ) === Components.Force );
                const nameComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Name );

                geometryComponent.data.plugin.forces = [];
                forces.forEach( force => {
                    const forceVector = Util.angleToVector( Util.toRadians( force.data.direction ) );
                    geometryComponent.data.plugin.forces.push( {
                        x: forceVector.x * force.data.magnitude,
                        y: forceVector.y * force.data.magnitude
                    } );
                } );

                positionComponent.data.x = geometryComponent.data.position.x;
                positionComponent.data.y = geometryComponent.data.position.y;
                rotationComponent.data = geometryComponent.data.angle;
            }
        },
        'update': {
            value: function( delta ) {
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
