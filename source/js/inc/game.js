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

module.exports = function( id, view, scale ) {
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
            console.log( this.engine.entities );
            const physicsSystem = PhysicsSystem();
            const renderSystem = RenderSystem( {
                // @TODO make this less terrible
                app: App,
                backgroundColor: this.getEnvironment().components.find( c => Object.getPrototypeOf( c ) === Components.Color ).data,
                graphics: new PIXI.Graphics(),
                hub: hub
            } );
            const playerManagerSystem = PlayerManagerSystem( { hub: hub } );
            this.engine.addSystems( playerManagerSystem, physicsSystem, renderSystem )
            physicsSystem.start();
            renderSystem.start();
            playerManagerSystem.start();
            // this.engine.update();
            // engine updates are trigerred by pixi ticker.
            App.ticker.add( this.engine.update.bind( this.engine ) );
        },
        getEnvironment() {
            // finds the first environment entity
            const envFinder = e => {
                return !!( e.components.find(
                    c => Object.getPrototypeOf( c ) === Components.Name &&
                    c.data === 'Environment' )
                );
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
            let component;
            let texture;

            switch ( type ) {
                case 'sprite':
                    texture = this.getTexture( actor, resources );
                    component = Components.Sprite.create( texture );
                    break;
                case 'tiling-sprite':
                    texture = this.getTexture( actor, resources );
                    const w = Util.property(actor.geometry, 'width' );
                    const h = Util.property(actor.geometry, 'height' );
                    component = Components.TilingSprite.create( texture, w, h );
                    break;
                case 'compound':
                    break;
                default:
                    break;
            }

            if ( component ) entity.addComponents( component );

            return component;
        },
        getTexture( actor, resources ) {
            const resourceKey = 'spritesheets::' + Util.property( actor.geometry, 'display.spritesheet' );
            const textureKey = Util.property( actor.geometry, 'display.id' );
            return resources[ resourceKey ].textures[ textureKey ];
        },
        /**
         * Loads gemometry from an `actor` from a config and turns it into
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

            switch ( type ) {
                case 'polygon':
                    component = Components.Polygon.create( Util.property( actor.geometry, 'vertices' ), { label: actor.name } );
                    break;
                case 'circle':
                    component = Components.Circle.create( Util.property( actor.geometry, 'radius' ), { label: actor.name } );
                    break;
                case 'rectangle':
                    component = Components.Rectangle.create( Util.property( actor.geometry, 'width') , Util.property( actor.geometry, 'height' ), { label: actor.name } );
                    break;
                case 'compound':
                    const children = Util.property( actor.geometry, 'children' );
                    const childrenComponent = Components.Children.create();
                    const parts = Array( children.length );

                    childrenComponent.data.length = children.length;

                    children.forEach( ( child, idx ) => {
                        const childEntity = Entity(
                            Components.Name.create( child.name ),
                            Components.Position.create( Util.property( child.position, 'x' ), Util.property( child.position, 'y' ) ),
                            Components.Rotation.create( child.rotation ),
                            Components.Scale.create( child.scale ),
                            Components.Parent.create( entity ),
                            childrenComponent
                        );

                        const geometryComponent = this.loadGeometry( child, childEntity );
                        parts[ idx ] = geometryComponent.data;

                        this.loadSkinning( child, childEntity );
                        this.engine.addEntities( childEntity );

                        childrenComponent.data[ idx ] = childEntity;
                    } );

                    component = Components.CompoundBody.create( parts, { label: actor.name } );
                    break;
                default:
                    break;
            }

            if ( component ) {
                const positionComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Position );
                const rotationComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Rotation );
                const scaleComponent = entity.components.find( component => Object.getPrototypeOf( component ) === Components.Scale );

                Matter.Body.setPosition( component.data, positionComponent.data );
                Matter.Body.setAngle( component.data, rotationComponent.data );
                Matter.Body.scale( component.data, scaleComponent.data, scaleComponent.data );
                entity.addComponents( component );
            }

            return component;
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
// W
window.addEventListener( 'keydown', e => {
    if ( e.which === 87 ) {
        console.log(e.repeat);
        hub.sendMessage( {
            type: 'player-input-thrust',
            data: 1
        } );
    }
}, false );
window.addEventListener( 'keyup', e => {
    if ( e.which === 87 ) {
        hub.sendMessage( {
            type: 'player-input-thrust',
            data: 0
        } );
    }
}, false );
// S
window.addEventListener( 'keydown', e => {
    if ( e.which === 83 ) {
        hub.sendMessage( {
            type: 'player-input-thrust',
            data: -1
        } );
    }
}, false );
window.addEventListener( 'keyup', e => {
    if ( e.which === 83 ) {
        hub.sendMessage( {
            type: 'player-input-thrust',
            data: 0
        } );
    }
}, false );
// A
window.addEventListener( 'keydown', e => {
    if ( e.which === 65 ) {
        hub.sendMessage( {
            type: 'player-input-turn',
            data: -1
        } );
    }
}, false );
window.addEventListener( 'keyup', e => {
    if ( e.which === 65 ) {
        hub.sendMessage( {
            type: 'player-input-turn',
            data: 0
        } );
    }
}, false );
// D
window.addEventListener( 'keydown', e => {
    if ( e.which === 68 ) {
        hub.sendMessage( {
            type: 'player-input-turn',
            data: 1
        } );
    }
}, false );
window.addEventListener( 'keyup', e => {
    if ( e.which === 68 ) {
        hub.sendMessage( {
            type: 'player-input-turn',
            data: 0
        } );
    }
}, false );
// P
window.addEventListener( 'keydown', e => {
    // if ( e.which === 80 ) boost = true;
}, false );
