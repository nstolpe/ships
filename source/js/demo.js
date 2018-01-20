'use strict';

const Turms = require('turms');
const Util = require('./inc/util.js');
const Game = require('./inc/game.js');

const env = Object.assign({
    id: 'default'
}, Util.locationArgs(window));

const game = Game({
    id: env.id,
    viewAttributes: {
        id: 'view',
        className: 'view',
    },
    wrapperSelector: '#view-wrapper',
    resolution: window.devicePixelRatio
}).load();
