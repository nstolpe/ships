"use strict";

const Util = require( './util.js' );
const Loader = require( 'pixi.js' ).loader;
const ECS = require( './ecs.js' );
const Entity = ECS.Entity;
const Components = ECS.Components;
const Engine = ECS.Engine;

function GameObject( config ) {
    console.log( config );
}

const defaultConfig = {
    spritesheets: [],
    environment: {
        forces:[],
        background: 0x000000
    },
    entities: []
};

module.exports = function( id ) {
    return {
        id: id,
        dataPath: 'assets/data',
        environment: {
            forces: [],
            background: 0x000000
        },
        gameObjects: [],
        config: defaultConfig,
        engine: Engine(),
        load() {
            Loader
                .add( 'config', `${ this.dataPath }/${ this.id }.json` )
                .load( this.postLoad.bind( this ) );

            return this;
        },
        postLoad( loader, resources ) {
            const config = resources.config;
            Object.assign( this.config, config.data );

            // queue all sprite sheets for loading.
            this.config[ 'spritesheets' ].forEach( ( e, i, a ) => {
                Loader.add( `spritesheets::${ e }`, `assets/spritesheets/${ e }.json` );
            } );

            // load everything
            Loader.load( ( loader, resources ) => {
                // create an environment entity and add it to the engine
                let Environment = Entity(
                    Components.color( this.environment.background ),
                    Components.name( 'Environment' )
                );

                this.config.environment.forces.forEach( force => {
                    Environment.addComponents( Components.force(
                                force.direction,
                                force.magnitude
                    ) );
                } );

                this.engine.addEntities( Environment );

                console.log( this.engine.entities );

                resources.config.data.entities.forEach( ( e, i, a ) => {
                    this.gameObjects.push( GameObject( e ) );
                } );
            } );
        }
    }
}
