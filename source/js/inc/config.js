"use strict";

const Util = require( './util.js' );
const Loader = require( 'pixi.js' ).loader;

function GameObject( config ) {
    console.log( config );
}

module.exports = function( id ) {
    console.log( id );
    return {
        id: id,
        dataPath: 'assets/data',
        environment: {
            forces: [],
            background: 0x000000
        },
        gameObjects: [],
        config: {
            spritesheets: []
        },
        load() {
            Loader
                .add( 'config', `${ this.dataPath }/${ this.id }.json` )
                .load( this.postLoad.bind( this ) );

            return this;
        },
        postLoad( loader, resources ) {
            Object.assign( this.config, resources.config.data );

            // queue all sprite sheets for loading.
            this.config[ 'spritesheets' ].forEach( ( e, i, a ) => {
                Loader.add( `spritesheets::${ e }`, `assets/spritesheets/${ e }.json` );
            } );

            // load everything
            Loader.load( ( loader, resources ) => {
                // console.log( resources[ `spritesheets::assets` ].textures );
                // console.log( resources.config.data );
                resources.config.data[ 'game-objects' ].forEach( ( e, i, a ) => {
                    this.gameObjects.push( GameObject( e ) );
                } );
            } );
        }
    }
}
