"use strict";

const PIXI = require( 'pixi.js' );
const Turms = require( 'turms' );
const Util = require( './util.js' );
const ECS = require( './ecs.js' );
const RenderSystem = require( './render-system.js' );

const Entity = ECS.Entity;
const Components = ECS.Components;
const Engine = ECS.Engine;

const defaultConfig = {
    spritesheets: [],
    environment: {
        forces:[],
        background: 0x000000
    },
    actors: []
};

const Hub = Turms.Hub();

module.exports = function( id, view, scale, dimensions ) {
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
            this.engine.on( 'entity-added', () => console.log( 'yeah that did it') );
            this.loadEnvironment();
            this.loadActors( this.config.actors );
            this.loadGraphics();
            console.log( this.engine.entities );
            this.renderSystem = RenderSystem();
            this.engine.addSystems( this.renderSystem );
            this.renderSystem.start();
            this.engine.update();
        },
        loadGraphics() {
            // finds the first environment entity
            const envFinder = e => {
                return !!( e.components.find(
                    c => Object.getPrototypeOf( c ) === Components.Name &&
                    c.data === 'Environment' )
                );
            };
            const environment = this.engine.entities.find( envFinder );
            const background = environment.components.find( c => Object.getPrototypeOf( c ) === Components.Color );

            this.engine.addEntities( Entity(
                Components.Canvas.create( this.view )
            ) );

            this.engine.addEntities( Entity(
                Components.PIXIApp.create( new PIXI.Application(
                    this.view.clientWidth * this.scale,
                    this.view.clientHeight * this.scale,
                    {
                        view: this.view,
                        backgroundColor: background.data,
                        resolution: this.scale,
                        autoresize: true
                    }
                ) )
            ) );
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
                case 'multi':
                    break;
                default:
                    break;
            }

            if ( component )
                entity.addComponents( component );
        },
        getTexture( actor, resources ) {
            const resourceKey = 'spritesheets::' + Util.property( actor.geometry, 'display.spritesheet' );
            const textureKey = Util.property( actor.geometry, 'display.id' );
            return resources[ resourceKey ].textures[ textureKey ];
        },
        /**
         * Loads gemometry from an `actor` from a config and turns it into
         * a geometry `component` for an `entity`
         * @TODO finish multi
         */
        loadGeometry( actor, entity ) {
            const type = Util.property( actor.geometry, 'display.type' );
            const components =[];

            switch ( type ) {
                case 'polygon':
                    components.push( Components.Polygon.create( Util.property( actor.geometry, 'vertices' ) ) );
                    break;
                case 'circle':
                    components.push( Components.Circle.create( Util.property( actor.geometry, 'radius' ) ) );
                    break;
                case 'rectangle':
                    components.push( Components.Rectangle.create( Util.property( actor.geometry, 'width') , Util.property( actor.geometry, 'height' ) ) );
                    break;
                case 'multi':
                    const children = Util.property( actor.geometry, 'children' );
                    this.loadActors( children );
                    break;
                default:
                    break;
            }

            if ( components ) entity.addComponents.apply( this, components );
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
