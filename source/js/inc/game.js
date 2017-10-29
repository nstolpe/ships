"use strict";

const PIXI = require( 'pixi.js' );
const Turms = require( 'turms' );
const ECS = require( './ecs.js' );

const Loader = PIXI.loader;
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
        spritesheetTemplate: filename => {
            return `assets/spritesheets/${ filename }.json`;
        },
        spritesheetKey: filename => {
            return `spritesheets::${ filename }`;
        },
        load() {
            Loader
                .add( 'config', `${ this.dataPath }/${ this.id }.json` )
                .load( this.loadResources.bind( this ) );

            return this;
        },
        /**
         * Loads all of the resources from a config.
         */
        loadResources( loader, resources ) {
            const config = resources.config;
            // store incoming config
            Object.assign( this.config, config.data );

            // queue all sprite sheets for loading.
            // @TODO add other resources (sounds, etc) here once ready.
            this.config[ 'spritesheets' ].forEach( ( e, i, a ) => {
                Loader.add( this.spritesheetKey( e ), this.spritesheetTemplate( e ) );
            } );

            // load everything
            Loader.load( this.postLoad.bind( this ) );
        },
        postLoad( loader, resources ) {
            this.engine.on( 'entity-added', () => console.log( 'yeah that did it') );
            this.loadEnvironment();
            this.loadActors( resources );
            this.loadGraphics();
            console.log( this.engine.entities );
            this.renderSystem = ECS.RenderSystem();
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
        loadActors( resources ) {
            const actors = this.config.actors;

            actors.forEach( ( actor ) => {
                const entity = Entity(
                    Components.Name.create( actor.name ),
                    Components.Position.create( actor.position.x, actor.position.y ),
                    Components.Rotation.create( actor.rotation ),
                    Components.Scale.create( actor.scale )
                );

                this.loadGeometry( actor, entity );

                if ( actor.geometry.display )
                    this.loadSkinning( actor, entity, resources );

                this.engine.addEntities( entity );
            } );
        },
        loadSkinning( actor, entity, resources ) {
            const type = actor.geometry.display.type;
            let component;

            switch ( type ) {
                case 'sprite':
                    component = Components.Sprite.create( resources[ 'spritesheets::' + actor.geometry.display.spritesheet ].textures[ actor.geometry.display.id ] );
                    break;
                case 'multi':
                    break;
                default:
                    break;
            }

            if ( component )
                entity.addComponents( component );
        },
        /**
         * Loads gemometry from an `actor` from a config and turns it into
         * a geometry `component` for an `entity`
         * @TODO finish multi
         */
        loadGeometry( actor, entity ) {
            const type = actor.geometry.display.type;
            let component;

            switch ( type ) {
                case 'polygon':
                    component = Components.Polygon.create( actor.geometry.vertices );
                    break;
                case 'circle':
                    component = Components.Circle.create( actor.geometry.radius );
                    break;
                case 'rectangle':
                    component = Components.Rectangle.create( actor.geometry.width, actor.geometry.height );
                    break;
                case 'multi':
                    break;
                default:
                    break;
            }

            if ( component )
                entity.addComponents( component );
        },
        loadEnvironment() {
            const environment = this.config.environment;
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
