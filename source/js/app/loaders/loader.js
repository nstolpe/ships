'use strict';

const PIXI = require('pixi.js');
const Util = require('../util');

const proto = {
    loader: PIXI.loader,
    spritesheetTemplate: basename => {
        return `assets/spritesheets/${basename}.json`;
    },
    spritesheetKey: basename => {
        return `spritesheets::${basename}`;
    },
    /**
     * Entry point, kicks off loading.
     */
    load() {
        this.stage1();
        // this.hub.sendMessage({
        //     type: 'config-loaded',
        //     data: { config: {} }
        // });
    },
    stage1() {
        this.loader
            .add('config', `${this.dataPath}/${this.id}.json`)
            .load(this.stage2.bind(this));

        return this;
    },
    stage2() {
        const config = Util.property(this.loader, 'resources.config');
        // store incoming config
        // Object.assign(this.config, config.data);
        this.hub.sendMessage({
            type: 'config-loaded',
            data: { config: config.data }
        });
        // queue all sprite sheets for loading.
        // @TODO add other resources (sounds, etc) here once ready.
        Util.property(config.data, 'spritesheets', []).forEach(sheet => {
            console.log(sheet);
            this.loader.add(this.spritesheetKey(sheet), this.spritesheetTemplate(sheet));
        });

        // send
        this.loader.load((loader, assets) => {
            this.hub.sendMessage({
                type: 'assets-loaded',
                data: { assets }
            });
        });
    },
    sendMessage({ type, data }) {
        const message = { type, data };
        try {
            this.hub.sendMessage(message)
        } catch (error) {
            console.log(error);
        }
    }
};

module.exports = (hub, { id='default', dataPath='assets/data' } = {}) => {
    // const defaultBody = Matter.Body.create();
    const config = {
        spritesheets: [],
        environment: {
            forces:[],
            background: 0x000000
        },
        actors: []
    };
    return Object.assign(Object.create(proto), {
        id,
        dataPath,
        config,
        hub
    });
};
