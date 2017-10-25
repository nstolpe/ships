'use strict';

const Turms = require( 'turms' );
const Util = require( './inc/util.js' );
const Config = require( './inc/game.js' );

const env = Object.assign( {
    id: 'default'
}, Util.locationArgs( window ) );

const config = Config( env.id ).load();

