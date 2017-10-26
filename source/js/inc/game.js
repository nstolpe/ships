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

module.exports = function( id ) {
    return {
        id: id,
        dataPath: 'assets/data',
        config: defaultConfig,
        engine: Engine(),
        load() {
            Loader
                .add( 'config', `${ this.dataPath }/${ this.id }.json` )
                .load( this.loadResources.bind( this ) );

            return this;
        },
        loadResources( loader, resources ) {
            const config = resources.config;
            Object.assign( this.config, config.data );

            // queue all sprite sheets for loading.
            // @TODO add other resources (sounds, etc) here once ready.
            this.config[ 'spritesheets' ].forEach( ( e, i, a ) => {
                Loader.add( `spritesheets::${ e }`, `assets/spritesheets/${ e }.json` );
            } );

            // load everything
            Loader.load( ( loader, resources ) => {
                this.setEnvironment();
                this.setActors();

                console.log( this.engine.entities );
            } );
        },
        setActors() {
            const actors = this.config.actors;

            actors.forEach( ( actor ) => {
                const entity = Entity(
                    Components.name( actor.name ),
                    Components.position( actor.position ),
                    Components.rotation( actor.rotation ),
                    Components.scale( actor.scale )
                );
                this.setGeometry( actor, entity );
                this.engine.addEntities( entity );
            } );
        },
        setGeometry( actor, entity ) {
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
                    component = Components.nogeo();
                    break;
                default:
                    component = Components.nogeo();
                    break;
            }

            entity.addComponents( component );
        },
        setEnvironment() {
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
