'use strict';

const Matter = require( 'matter-js' );
// const MatterAttractors = require( 'matter-attractors' );
const ECS = require( './ecs.js' );
const MatterForces = require( './matter-forces' );
const Util = require( './util' );

const Components = ECS.Components;
const System = ECS.System;

// @TODO make this optional/configurable. physics-plugin section or matter-plugin section.
Matter.use( 'matter-forces' );

const PhysicsSystem = function( options ) {
    let bodies;
    let constraints;
    // @TODO configurable.
    const world = Matter.World.create( {
        gravity: { x: 0, y: 0, scale: 0.001 }
    } );

    const engine = Matter.Engine.create( { world: world } );
    let hub = options.hub;

    const system = Object.create( System, {
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start.call( this );
                this.setEntities();
                const entities = this.entities.bodies();
                const environment = this.entities.environment();

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

                const constraintEntities = this.entities.constraints();

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
        'updateEntity': {
            value: function( entity, environment ) {
                const geometryComponent =
                    entity.data.Polygon ||
                    entity.data.CompoundBody ||
                    entity.data.Rectangle ||
                    entity.data.Circle;
                const positionComponent = entity.data.Position;
                const rotationComponent = entity.data.Rotation;
                const scaleComponent = entity.data.Scale;
                const force = environment.data.Force;
                const nameComponent = entity.data.Name;
                const parentComponent = entity.data.Parent;

                geometryComponent.data.plugin.forces = [];

                // @TODO currents should be sensors that add a force to colliding objects.
                // forces.forEach( force => {
                    const forceVector = Util.angleToVector( Util.toRadians( force.data.direction ) );
                    geometryComponent.data.plugin.forces.push( {
                        x: forceVector.x * force.data.magnitude,
                        y: forceVector.y * force.data.magnitude
                    } );
                // } );

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
                const entities = this.entities.bodies();
                const environment = this.entities.environment();

                entities.forEach( entity => this.updateEntity( entity, environment ) );
                Matter.Engine.update( engine, delta );
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

    Object.assign( system.entities, {
        bodies() {
            if ( !bodies ) {

                bodies = system.engine.entities.filter( entity => {
                    return entity.components.find( component => component.is( Components.Polygon ) ) ||
                           entity.components.find( component => component.is( Components.CompoundBody ) ) ||
                           entity.components.find( component => component.is( Components.Rectangle ) ) ||
                           entity.components.find( component => component.is( Components.Circle ) );
                } );
            }

            return bodies;
        },
        constraints() {
            if ( !constraints )
                constraints = system.engine.entities.filter( entity => !!entity.data.Constraint );

            return constraints;
        },
        environment() {
            // finds the first environment entity
            const envFinder = entity => {
                return !!( entity.components.find(
                    component => component.is( Components.Name ) && component.data === 'Environment' )
                );
            };
            const environment = system.engine.entities.find( envFinder );
            return environment;
        }
    } );
    return system;
}

module.exports = PhysicsSystem;
