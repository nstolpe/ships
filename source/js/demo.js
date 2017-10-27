'use strict';

const Turms = require( 'turms' );
const Util = require( './inc/util.js' );
const Game = require( './inc/game.js' );

const env = Object.assign( {
    id: 'default'
}, Util.locationArgs( window ) );

const game = Game(
    env.id,
    document.getElementById( 'view' ),
    window.devicePixelRatio
).load();
