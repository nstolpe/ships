'use strict';

const Turms = require('turms');
const Util = require('app/util.js');
const Game = require('app/game.js');

const env = Object.assign({
    id: 'default'
}, Util.locationArgs(window));

const game = Game({
    id: env.id,
    element: document.getElementById('game'),
    resolution: window.devicePixelRatio
}).start();
