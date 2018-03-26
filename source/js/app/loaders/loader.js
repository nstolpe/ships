'use strict';

const PIXI = require('pixi.js');
const Util = require('app/util');

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
        this.loadConfig();
    },
    /**
     * Loads the config file.
     */
    loadConfig() {
        this.loader
            .add('config', `${this.dataPath}/${this.id}.json`)
            .load(this.loadAssets.bind(this));

        return this;
    },
    loadAssets() {
        const config = Util.property(this.loader, 'resources.config');

        this.sendMessage({
           type: 'config-loaded',
            data: { config: config.data }
        })

        // queue all sprite sheets for loading.
        // @TODO add other resources (sounds, etc) here once ready.
        Util.property(config.data, 'spritesheets', []).forEach(sheet => {
            console.log(sheet);
            this.loader.add(this.spritesheetKey(sheet), this.spritesheetTemplate(sheet));
        });

        // send
        this.loader.load((loader, resources) => {
            this.sendMessage({
                type: 'assets-loaded',
                data: { resources }
            });
        });
    },
    getTexture(spritesheet, id) {
        const resources = Util.property(this.loader, 'resources');
        const resourceKey = `spritesheets::${spritesheet}`;
        return Util.property(resources,[resourceKey, 'textures', id]);
    },
    /**
     * Wrapper for `this.hub.sendMessage`. Catches in case the hub passed in was invalide.
     */
    sendMessage({ type, data }) {
        const message = { type, data };
        if (typeof this.hub.sendMessage === 'function')
            this.hub.sendMessage(message);
        else
            console.warn('unable to send message:', message);
    }
};

module.exports = (hub, { id='default', dataPath='assets/data' } = {}) => {
    const config = {
        spritesheets: [],
        environment: {
            forces:[],
            background: 0x000000
        },
        actors: []
    };
    console.log(hub);
    return Object.assign(Object.create(proto), {
        id,
        dataPath,
        config,
        hub
    });
};
