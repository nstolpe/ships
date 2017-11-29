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
    let entities;
    let constraints;
    const world = Matter.World.create( {
        gravity: { x: 0, y: 0, scale: 0.001 }
    } );

    const engine = Matter.Engine.create( { world: world } );
    let hub = options.hub;

    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start();
                const entities = this.getEntities();
                const environment = this.getEnvironment();

                entities.forEach( entity => {
                    const geometryComponent = entity.components.find( component => component.is( Components.Polygon ) ) ||
                           entity.components.find( component => component.is( Components.CompoundBody ) ) ||
                           entity.components.find( component => component.is( Components.Rectangle ) ) ||
                           entity.components.find( component => component.is( Components.Circle ) );

                    // prevents compound children from being added.
                    if ( !entity.components.find( component => component.is( Components.Parent ) ) )
                        Matter.World.add( engine.world, [ geometryComponent.data ] );

                    this.updateEntity( entity, environment );
                } );

                const constraintEntities = this.getConstraints();

                constraintEntities.forEach( constraintEntity => {
                    Matter.World.add( engine.world, [ constraintEntity.data.Constraint.data ]);
                } );

                this.bindEvents();
                // // @TODO move this into function when debug setting on
                // var render = Matter.Render.create( {
                //     canvas: document.getElementById( 'render' ),
                //     engine: engine,
                //     options: {
                //         showDebug: true,
                //         showInternalEdges: true,
                //         showAngleIndicator: true,
                //         // showAxes: true,
                //         showVertexNumbers: true,
                //         showCollisions: true,
                //         showSeparations: true,
                //         showBroadphase: true,
                //         showVelocity: true,
                //         width: document.getElementById( 'render' ).clientWidth * 1.5,
                //         height: document.getElementById( 'render' ).clientHeight * 1.5,
                //     }
                // } );
                // Matter.Render.run( render );
                // Matter.Engine.run( engine );
                // Matter.Events.on( engine, 'afterUpdate', this.update.bind( this ) );

                // @TODO here now for implementation, but this needs to go to another system
                // events: collisionStart collisionActive collisionEnd
            }
        },
        'getEntities': {
            value: function() {
                if ( !entities ) {

                    entities = this.engine.entities.filter( entity => {
                        return entity.components.find( component => component.is( Components.Polygon ) ) ||
                               entity.components.find( component => component.is( Components.CompoundBody ) ) ||
                               entity.components.find( component => component.is( Components.Rectangle ) ) ||
                               entity.components.find( component => component.is( Components.Circle ) );
                    } );
                }

                return entities;
            }
        },
        'getConstraints': {
            value: function() {
                if ( !constraints )
                    constraints = this.engine.entities.filter( entity => !!entity.data.Constraint );

                return constraints;
            }
        },
        'updateEntity': {
            value: function( entity, environment ) {
                const geometryComponent = entity.components.find( component => {
                    return component.is( Components.Polygon ) ||
                        component.is( Components.CompoundBody ) ||
                        component.is( Components.Rectangle ) ||
                        component.is( Components.Circle );
                } );
                const positionComponent = entity.components.find( component => component.is( Components.Position ) );
                const rotationComponent = entity.components.find( component => component.is( Components.Rotation ) );
                const scaleComponent = entity.components.find( component => component.is( Components.Scale ) );
                const forces = environment.components.filter( component => component.is( Components.Force ) );
                const nameComponent = entity.components.find( component => component.is( Components.Name ) );
                const parentComponent = entity.components.find( component => component.is( Components.Parent ) );

                geometryComponent.data.plugin.forces = [];
                forces.forEach( force => {
                    const forceVector = Util.angleToVector( Util.toRadians( force.data.direction ) );
                    geometryComponent.data.plugin.forces.push( {
                        x: forceVector.x * force.data.magnitude,
                        y: forceVector.y * force.data.magnitude
                    } );
                } );

                positionComponent.data.y = geometryComponent.data.position.y;
                positionComponent.data.x = geometryComponent.data.position.x;
                // if there's a parent component, rotation comes from it
                if ( parentComponent ) {
                    const parentGeoComp = parentComponent.data.components.find( component => component.is( Components.CompoundBody ) );
                    rotationComponent.data = parentGeoComp.data.angle;
                } else {
                    rotationComponent.data = geometryComponent.data.angle;
                }
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
                const envFinder = entity => {
                    return !!( entity.components.find(
                        component => component.is( Components.Name ) && component.data === 'Environment' )
                    );
                };
                const environment = this.engine.entities.find( envFinder );
                return environment;
            }
        },
        'bindEvents': {
            value: function(){
                Matter.Events.on ( engine, 'collisionStart', e => {
                    e.pairs.forEach( pair => {
                        hub.sendMessage( {
                            type: 'collision-start',
                            data: { bodyA: pair.bodyA, bodyB: pair.bodyB }
                        } );
                    } );
                } );
                Matter.Events.on ( engine, 'collisionEnd', e => {
                    e.pairs.forEach( pair => {
                        hub.sendMessage( {
                            type: 'collision-end',
                            data: { bodyA: pair.bodyA, bodyB: pair.bodyB }
                        } );
                    } );
                } );
            }
        }
    } );

    return system;
}

module.exports = PhysicsSystem;
