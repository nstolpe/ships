'use strict';

const Turms = require('turms');
const Util = require('app/util.js');
const GameScreen = require('app/game-screen.js');

const env = Object.assign({
    id: 'default'
}, Util.locationArgs(window));

const game = GameScreen({
    id: env.id,
    element: document.getElementById('game'),
    resolution: window.devicePixelRatio
}).start();
