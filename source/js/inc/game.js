"use strict";

const PIXI = require( 'pixi.js' );
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

module.exports = function( id, view, scale ) {
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
            this.loadEnvironment();
            this.loadActors();
            this.loadUI();
            console.log( this.engine.entities );
        },
        loadUI() {
            this.engine.addEntities( Entity(
                Components.canvas( this.view )
            ) );
        },
        loadActors() {
            const actors = this.config.actors;

            actors.forEach( ( actor ) => {
                const entity = Entity(
                    Components.name( actor.name ),
                    Components.position( actor.position ),
                    Components.rotation( actor.rotation ),
                    Components.scale( actor.scale )
                );
                this.loadGeometry( actor, entity );
                this.engine.addEntities( entity );
            } );
        },
        /**
         * Loads gemometry from an `actor` from a config and turns it into
         * a geometry `component` for an `entity`
         * @TODO finish multi
         */
        loadGeometry( actor, entity ) {
            const geoType = actor.geometry.type;
            let component;

            switch ( geoType ) {
                case 'polygon':
                    component = Components.polygon( actor.geometry.vertices );
                    break;
                case 'circle':
                    component = Components.circle( actor.geometry.radius );
                    break;
                case 'rectangle':
                    component = Components.rectangle( actor.geometry.width, actor.geometry.height );
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
                Components.color( environment.background ),
                Components.name( 'Environment' )
            );

            environment.forces.forEach( force => {
                let component = Components.force( force.direction, force.magnitude );
                entity.addComponents( component );
            } );

            this.engine.addEntities( entity );
        }
    }
}
