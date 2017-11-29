"use strict";

const PIXI = require( 'pixi.js' );
const Matter = require( 'matter-js' );
const decomp = require('poly-decomp');
window.decomp = decomp;

const Turms = require( 'turms' );
const Util = require( './util.js' );
const ECS = require( './ecs.js' );
const RenderSystem = require( './render-system.js' );
const PhysicsSystem = require( './physics-system.js' );
const PlayerManagerSystem = require( './player-manager-system.js' );

const Entity = ECS.Entity;
const Components = ECS.Components;
const Engine = ECS.Engine;
const hub = Turms.Hub();

const defaultConfig = {
    spritesheets: [],
    environment: {
        forces:[],
        background: 0x000000
    },
    actors: []
};

const constraintQueue = [];

module.exports = function( id, view, scale ) {
    let defaultMatter = Matter.Body.create();

    const App = new PIXI.Application(
        view.clientWidth * scale,
        view.clientHeight * scale,
        {
            view: view,
            resolution: scale,
            autoresize: true
        }
    );
    return {
        id: id,
        view: view,
        scale: scale,
        dataPath: 'assets/data',
        config: defaultConfig,
        engine: Engine(),
        loader: PIXI.loader,
        spritesheetTemplate: filename => {
            return `assets/spritesheets/${ filename }.json`;
        },
        spritesheetKey: filename => {
            return `spritesheets::${ filename }`;
        },
        load() {
            this.loader
                .add( 'config', `${ this.dataPath }/${ this.id }.json` )
                .load( this.loadResources.bind( this ) );

            return this;
        },
        /**
         * Loads all of the resources from a config.
         */
        loadResources() {
            const loader = this.loader;
            const config = loader.resources.config;
            // store incoming config
            Object.assign( this.config, config.data );

            // queue all sprite sheets for loading.
            // @TODO add other resources (sounds, etc) here once ready.
            this.config[ 'spritesheets' ].forEach( ( e, i, a ) => {
                this.loader.add( this.spritesheetKey( e ), this.spritesheetTemplate( e ) );
            } );

            // load everything
            this.loader.load( this.postLoad.bind( this ) );
        },
        postLoad() {
            this.loadEnvironment();
            this.loadActors( this.config.actors );
            this.loadConstraints();

            const physicsSystem = PhysicsSystem( { hub: hub } );
            const renderSystem = RenderSystem( {
                app: App,
                backgroundColor: this.getEnvironment().components.find( component => component.is( Components.Color ) ).data,
                graphics: new PIXI.Graphics(),
                hub: hub,
                debug: true
            } );
            const playerManagerSystem = PlayerManagerSystem( { hub: hub } );

            this.engine.addSystems( playerManagerSystem, physicsSystem, renderSystem )

            physicsSystem.start();
            renderSystem.start();
            playerManagerSystem.start();

            // engine updates are trigerred by pixi ticker.
            App.ticker.add( this.engine.update.bind( this.engine ) );
        },
        getEnvironment() {
            // finds the first environment entity
            const envFinder = e => {
                return !!( e.components.find( component => component.is( Components.Name ) && component.data === 'Environment' ) );
            };
            const environment = this.engine.entities.find( envFinder );
            return environment;
        },
        loadActors( actors ) {
            actors.forEach( ( actor ) => {
                const entity = Entity(
                    Components.Name.create( actor.name ),
                    Components.Position.create( Util.property( actor.position, 'x' ), Util.property( actor.position, 'y' ) ),
                    Components.Rotation.create( actor.rotation ),
                    Components.Scale.create( actor.scale )
                );

                this.loadGeometry( actor, entity );

                if ( actor.manager === 'player' )
                    entity.addComponents( Components.PlayerManager.create() );

                if ( actor.geometry.display )
                    this.loadSkinning( actor, entity );

                this.engine.addEntities( entity );
            } );
        },
        loadSkinning( actor, entity ) {
            const type = Util.property( actor.geometry, 'display.type' );
            const resources = this.loader.resources;
            let skinningComponent;
            let texture;

            switch ( type ) {
                case 'sprite':
                    texture = this.getTexture( actor, resources );
                    skinningComponent = Components.Sprite.create( texture );
                    break;
                case 'tiling-sprite':
                    texture = this.getTexture( actor, resources );
                    const w = Util.property(actor.geometry, 'width' );
                    const h = Util.property(actor.geometry, 'height' );
                    skinningComponent = Components.TilingSprite.create( texture, w, h );
                    break;
                case 'compound':
                    const children = Util.property( actor.geometry, 'children' );
                    skinningComponent = Components.Container.create();
                    const childrenComponent = entity.components.find( skinningComponent => skinningComponent.is( Components.Children ) );

                    children.forEach( ( child, idx ) => {
                        const childEntity = childrenComponent.data[ idx ];
                        const renderComponent = this.loadSkinning( child, childEntity );
                        childEntity.addComponents( renderComponent );
                        skinningComponent.data.addChild( renderComponent.data );
                    } );
                    break;
                default:
                    break;
            }

            if ( skinningComponent ) {
                entity.addComponents(
                    skinningComponent,
                    Components.Alpha.create( actor.alpha ),
                    Components.Tint.create( actor.tint )
                );
            }

            return skinningComponent;
        },
        getTexture( actor, resources ) {
            const resourceKey = 'spritesheets::' + Util.property( actor.geometry, 'display.spritesheet' );
            const textureKey = Util.property( actor.geometry, 'display.id' );
            return resources[ resourceKey ].textures[ textureKey ];
        },
        /**
         * Loads geometry from an `actor` from a config and turns it into
         * a geometry `component` for an `entity`
         *
         * @param {object} actor   Actor data from a config.
         * @param {object} entity  An instance of `ECS.Entity`
         * @return {object}        An instance of `ECS.Components.Polyogon`,
         *                                        `ECS.Components.Rectangle`,
         *                                        `ECS.Components.Circle`,
         *                                     or `ECS.Components.CompoundBody`
         */
        loadGeometry( actor, entity ) {
            const type = Util.property( actor.geometry, 'type' );
            let component;
            let options = {
                label: actor.name,
                density: Util.isNumeric( actor.density ) ? parseFloat( actor.density ) : .001,
                restitution: Util.isNumeric( actor.restitution ) ? parseFloat( actor.restitution ) : 0,
                friction: Util.isNumeric( actor.friction ) ? parseFloat( actor.friction ) : 0.1,
                frictionAir: Util.isNumeric( actor.frictionAir ) ? parseFloat( actor.frictionAir ) : 0.01,
                frictionStatic: Util.isNumeric( actor.frictionStatic ) ? parseFloat( actor.frictionStatic ) : 0.5,
                isStatic: !!actor.isStatic,
                isSensor: !!actor.isSensor
            };

            // @TODO make these options all mergable into a default.
            if ( actor.geometry.collisionFilter ) {
                // maybe switch to js config files instead of json. can use hex ints
                if ( actor.geometry.collisionFilter.category )
                    actor.geometry.collisionFilter.category = parseInt( actor.geometry.collisionFilter.category, 16 );
                if ( actor.geometry.collisionFilter.mask )
                    actor.geometry.collisionFilter.mask = parseInt( actor.geometry.collisionFilter.mask, 16 );
                if ( actor.geometry.collisionFilter.group )
                    actor.geometry.collisionFilter.group = parseInt( actor.geometry.collisionFilter.group, 16 );

                options.collisionFilter = Object.assign( Object.create( defaultMatter.collisionFilter ), actor.geometry.collisionFilter );
            }

            switch ( type ) {
                case 'polygon':
                    component = Components.Polygon.create( Util.property( actor.geometry, 'vertices' ), options );
                    break;
                case 'circle':
                    component = Components.Circle.create( Util.property( actor.geometry, 'radius' ), options );
                    break;
                case 'rectangle':
                    component = Components.Rectangle.create( Util.property( actor.geometry, 'width') , Util.property( actor.geometry, 'height' ), options );
                    break;
                case 'compound':
                    const children = Util.property( actor.geometry, 'children' );
                    const childrenComponent = Components.Children.create();
                    const parts = Array( children.length );

                    entity.addComponents( childrenComponent );
                    childrenComponent.data.length = children.length;

                    children.forEach( ( child, idx ) => {
                        const childEntity = Entity(
                            Components.Name.create( child.name ),
                            Components.Position.create( Util.property( child.position, 'x' ), Util.property( child.position, 'y' ) ),
                            Components.Rotation.create( child.rotation ),
                            Components.Scale.create( child.scale ),
                            Components.Parent.create( entity )
                        );

                        // recursion. shouldn't get too crazy
                        const geometryComponent = this.loadGeometry( child, childEntity );
                        parts[ idx ] = geometryComponent.data;

                        this.engine.addEntities( childEntity );

                        childrenComponent.data[ idx ] = childEntity;
                    } );

                    component = Components.CompoundBody.create( parts, options );
                    break;
                default:
                    break;
            }

            if ( component ) {
                const positionComponent = entity.components.find( component => component.is( Components.Position ) );
                const rotationComponent = entity.components.find( component => component.is( Components.Rotation ) );
                const scaleComponent = entity.components.find( component => component.is( Components.Scale ) );

                Matter.Body.setPosition( component.data, positionComponent.data );
                Matter.Body.setAngle( component.data, rotationComponent.data );
                Matter.Body.scale( component.data, scaleComponent.data, scaleComponent.data );
                entity.addComponents( component );

                if ( actor.geometry.constraints )
                    actor.geometry.constraints.forEach( constraint => {
                        constraintQueue.push( Object.assign( { entity: entity }, constraint ) )
                    } );
            }

            return component;
        },
        loadConstraints() {
            constraintQueue.forEach( options => {
                const entity = options.entity;
                const geometryComponentA =
                    entity.data.Polygon ||
                    entity.data.CompoundBody ||
                    entity.data.Rectangle ||
                    entity.data.Circle;

                // bail if there's no geometry component
                if ( !geometryComponentA ) return;

                options.bodyA = geometryComponentA.data;

                if ( options.bodyB ) {
                    const entityB = this.engine.entities.find( entity => {
                        const nameComponent = entity.data.Name;
                        return nameComponent && nameComponent.data === options.bodyB;
                    } );

                    if ( entityB ) {
                        const geometryComponent =
                            entityB.data.Polygon ||
                            entityB.data.CompoundBody ||
                            entityB.data.Circle ||
                            entityB.data.Rectangle;
                        if ( geometryComponent.data )
                            options.bodyB = geometryComponent.data;
                    }
                }

                delete options.entity;

                this.engine.addEntities( Entity( Components.Constraint.create( options ) ) );
            } );
        },
        loadEnvironment() {
            const config = this.config;
            const environment = config.environment;
            const entity = Entity(
                Components.Color.create( environment.background ),
                Components.Name.create( 'Environment' )
            );

            environment.forces.forEach( force => {
                let component = Components.Force.create( force.direction, force.magnitude );
                entity.addComponents( component );
            } );

            this.engine.addEntities( entity );
        }
    }
}

// @TODO move this out
document.getElementById( 'view' ).addEventListener( 'keydown', e => {
    let type;
    let data;

    switch ( e.which ) {
        // W
        case 87:
            if ( !e.repeat ) {
                type = 'player-input-thrust';
                data = 1 * .1;
            }
            break;
        // S
        case 83:
            if ( !e.repeat ) {
                type = 'player-input-thrust';
                data = -1 * .1;
            }
            break;
        // A
        case 65:
            if ( !e.repeat ) {
                type = 'player-input-turn'
                data = -1 * .2;
            }
            break;
        // D
        case 68:
            if ( !e.repeat ) {
                type = 'player-input-turn'
                data = 1 * .2;
            }
            break;
        // P
        case 80:
            if ( !e.repeat ) {
                type = 'player-input-boost'
                data = 20;
            }
            break;
        default:
            break;
    }

    if ( type !== undefined && data !== undefined )
        hub.sendMessage( { type: type, data: data } );
}, false );

document.getElementById( 'view' ).addEventListener( 'keyup', e => {
    let type;
    let data;

    switch ( e.which ) {
        // W
        case 87:
            type = 'player-input-thrust';
            data = 0;
            break;
        // S
        case 83:
            type = 'player-input-thrust';
            data = 0;
            break;
        // A
        case 65:
            type = 'player-input-turn';
            data = 0;
            break;
        // D
        case 68:
            type = 'player-input-turn';
            data = 0;
            break;
        // X
        case 88:
            type = 'player-input-dock';
            data = 0;
            break;
        default:
            break;
    }

    if ( type !== undefined && data !== undefined )
        hub.sendMessage( { type: type, data: data } );
}, false );

document.getElementById( 'view' ).addEventListener( 'wheel', e => {
    // the zoom delta needs to be inverted and scaled.
    console.log( e );
    if ( e.deltaY !== 0 )
        hub.sendMessage( { type: 'zoom', data: e.deltaY * -0.001 } );
}, false );
