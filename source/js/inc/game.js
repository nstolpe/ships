"use strict";

import React from "react";
import ReactDOM from "react-dom";
import * as PIXI from 'pixi.js';
import * as decomp from 'poly-decomp';
import * as Matter from 'matter-js';
import * as ActivateInputs from './activate-inputs.js';
import * as Util from './util.js';
import RenderSystem from './render-system.js';
import PhysicsSystem from './physics-system.js';
import PlayerManagerSystem from './player-manager-system.js';
import ScreenManager from './screen-manager.js';
import { Hub } from 'turms';
import { Entity, Components, Engine } from './ecs.js';

// matter-js needs `poly-decomp` attached to window or global as decomp
window.decomp = decomp;

const hub = Hub();

const defaultConfig = {
    spritesheets: [],
    environment: {
        forces:[],
        background: 0x000000
    },
    actors: []
};

const constraintQueue = [];

module.exports = function(options) {
    let defaultMatter = Matter.Body.create();

    return {
        id: options.id,
        element: options.element,
        app: null,
        view: null,
        resolution: options.resolution,
        dataPath: 'assets/data',
        config: defaultConfig,
        engine: Engine(),
        loader: PIXI.loader,
        screenManager: null,
        spritesheetTemplate: filename => {
            return `assets/spritesheets/${filename}.json`;
        },
        spritesheetKey: filename => {
            return `spritesheets::${filename}`;
        },
        load() {
            this.preLoad();
            this.loader
                .add('config', `${this.dataPath}/${this.id}.json`)
                .load(this.loadResources.bind(this));

            return this;
        },
        preLoad() {
            const view = <canvas id="view" tabIndex='0' className='view'/>;
            this.element.innerHTML = '';
            this.view = document.createElement('canvas');
            this.view.className = 'view';
            this.view.id = 'view';
            this.view.tabIndex = 0;
            // this.element.appendChild(this.view);
            ReactDOM.render(view, this.element);
            this.view = document.getElementById('view');
            // @TODO allow hidef through option, use resolution 1
            // seehttps://github.com/pixijs/pixi.js/issues/3833
            this.app = new PIXI.Application(
                this.view.clientWidth * this.resolution,
                this.view.clientHeight * this.resolution,
                {
                    view: this.view,
                    resolution: Math.min(2, this.resolution),
                    autoresize: true
                }
            );
            this.screenManager = ScreenManager(Object.assign({ hub: hub, app: this.app, debug: false }, options)).init();
        },
        /**
         * Loads all of the resources from a config.
         */
        loadResources() {
            const loader = this.loader;
            const config = loader.resources.config;
            // store incoming config
            Object.assign(this.config, config.data);

            // queue all sprite sheets for loading.
            // @TODO add other resources (sounds, etc) here once ready.
            this.config['spritesheets'].forEach((e, i, a) => {
                this.loader.add(this.spritesheetKey(e), this.spritesheetTemplate(e));
            });

            // load everything
            this.loader.load(this.postLoad.bind(this));
        },
        postLoad() {
            // activates all inputs
            ActivateInputs.activate(hub);
            this.loadEnvironment();
            this.loadActors(this.config.actors);
            this.loadConstraints();
            const physicsSystem = PhysicsSystem({ hub: hub });
            const renderSystem = RenderSystem({
                app: this.app,
                backgroundColor: this.getEnvironment().components.find(component => component.is(Components.Color)).data,
                graphics: new PIXI.Graphics(),
                hub: hub,
                // debug: true
            });
            const playerManagerSystem = PlayerManagerSystem({ hub: hub });

            this.engine.addSystems(playerManagerSystem, physicsSystem, renderSystem);

            physicsSystem.start();
            renderSystem.start();
            playerManagerSystem.start();

            // engine updates are trigerred by pixi ticker.
            this.app.ticker.add(this.engine.update.bind(this.engine));
        },
        getEnvironment() {
            // finds the first environment entity
            const envFinder = e => {
                return !!(e.components.find(component => component.is(Components.Name) && component.data === 'Environment'));
            };
            const environment = this.engine.entities.find(envFinder);
            return environment;
        },
        loadActors(actors) {
            actors.forEach((actor) => {
                const entity = Entity(
                    Components.Name.create(actor.name),
                    Components.Position.create(Util.property(actor.position, 'x') || 0, Util.property(actor.position, 'y')) || 0,
                    Components.Rotation.create(actor.rotation),
                    Components.Scale.create(Util.property(actor.scale, 'x') || 1 , Util.property(actor.scale, 'y')) || 1
                );

                this.loadGeometry(actor, entity);

                if (actor.manager === 'player')
                    entity.addComponents(Components.PlayerManager.create());

                if (actor.geometry.display)
                    this.loadSkinning(actor, entity);

                this.engine.addEntities(entity);
            });
        },
        loadSkinning(actor, entity) {
            const type = Util.property(actor.geometry, 'display.type');
            const resources = this.loader.resources;
            let skinningComponent;
            let texture;
            let fillComponent;
            let strokeComponent;
            let radiusComponent;

            switch (type) {
                case 'sprite':
                    texture = this.getTexture(actor, resources);
                    skinningComponent = Components.Sprite.create(texture);
                    break;
                case 'tiling-sprite':
                    texture = this.getTexture(actor, resources);
                    const w = Util.property(actor.geometry, 'width');
                    const h = Util.property(actor.geometry, 'height');
                    skinningComponent = Components.TilingSprite.create(texture, w, h);
                    break;
                case 'compound':
                    const children = Util.property(actor.geometry, 'children');
                    skinningComponent = Components.Container.create();
                    const childrenComponent = entity.components.find(skinningComponent => skinningComponent.is(Components.Children));

                    children.forEach((child, idx) => {
                        const childEntity = childrenComponent.data[idx];
                        const renderComponent = this.loadSkinning(child, childEntity);
                        childEntity.addComponents(renderComponent);
                        skinningComponent.data.addChild(renderComponent.data);
                    });
                    break;
                case 'graphics':
                    fillComponent = Components.Fill.create(Util.property(actor.geometry, 'display.fill'))
                    strokeComponent = Components.Stroke.create(
                        Util.property(actor.geometry, 'display.stroke'),
                        Util.property(actor.geometry, 'display.stroke-width')
                    );
                    entity.addComponents(fillComponent, strokeComponent);
                    skinningComponent = Components.Graphics.create();
                    break;
                default:
                    break;
            }

            if (skinningComponent) {
                entity.addComponents(
                    skinningComponent,
                    Components.Alpha.create(actor.alpha),
                    Components.Tint.create(actor.tint)
                );
            }

            // set interactive to true. @TODO why only the above checked for?
            skinningComponent.data.interactive = true;
            skinningComponent.data.cursor = 'pointer';
            skinningComponent.data.pivot.set(skinningComponent.data.width * 0.5, skinningComponent.data.height * 0.5);
            // @TODO geometry and visuals need to be separate in config, w/ independent scales.
            let scale = Util.property(actor.geometry, 'display.scale');
            if (scale)
                skinningComponent.data.scale.set(scale.x, scale.y);

            return skinningComponent;
        },
        getTexture(actor, resources) {
            const resourceKey = 'spritesheets::' + Util.property(actor.geometry, 'display.spritesheet');
            const textureKey = Util.property(actor.geometry, 'display.id');
            return resources[resourceKey].textures[textureKey];
        },
        /**
         * Loads geometry from an `actor` from a config and turns it into
         * a geometry `component` for an `entity`
         *
         * @param {object} actor   Actor data from a config.
         * @param {object} entity  An instance of `ECS.Entity`
         * @return {object}        An instance of `ECS.Components.Polyogon`,
         *                                        `ECS.Components.Rectangle`,
         *                                        `ECS.Components.Circle`,
         *                                     or `ECS.Components.CompoundBody`
         */
        loadGeometry(actor, entity) {
            const type = Util.property(actor.geometry, 'type');
            let component;
            let options = {
                label: actor.name,
                density: Util.isNumeric(actor.density) ? parseFloat(actor.density) : .001,
                restitution: Util.isNumeric(actor.restitution) ? parseFloat(actor.restitution) : 0,
                friction: Util.isNumeric(actor.friction) ? parseFloat(actor.friction) : 0.1,
                frictionAir: Util.isNumeric(actor.frictionAir) ? parseFloat(actor.frictionAir) : 0.01,
                frictionStatic: Util.isNumeric(actor.frictionStatic) ? parseFloat(actor.frictionStatic) : 0.5,
                isStatic: !!actor.isStatic,
                isSensor: !!actor.isSensor
            };

            // @TODO make these options all mergable into a default.
            if (actor.geometry.collisionFilter) {
                // maybe switch to js config files instead of json. can use hex ints
                if (actor.geometry.collisionFilter.category)
                    actor.geometry.collisionFilter.category = parseInt(actor.geometry.collisionFilter.category, 16);
                if (actor.geometry.collisionFilter.mask)
                    actor.geometry.collisionFilter.mask = parseInt(actor.geometry.collisionFilter.mask, 16);
                if (actor.geometry.collisionFilter.group)
                    actor.geometry.collisionFilter.group = parseInt(actor.geometry.collisionFilter.group, 16);

                options.collisionFilter = Object.assign(Object.create(defaultMatter.collisionFilter), actor.geometry.collisionFilter);
            }

            switch (type) {
                case 'polygon':
                    component = Components.Polygon.create(Util.property(actor.geometry, 'vertices'), options);
                    break;
                case 'circle':
                    component = Components.Circle.create(Util.property(actor.geometry, 'radius'), options);
                    break;
                case 'rectangle':
                    component = Components.Rectangle.create(Util.property(actor.geometry, 'width') , Util.property(actor.geometry, 'height'), options);
                    break;
                case 'compound':
                    const children = Util.property(actor.geometry, 'children');
                    const childrenComponent = Components.Children.create();
                    const parts = Array(children.length);

                    entity.addComponents(childrenComponent);
                    childrenComponent.data.length = children.length;

                    children.forEach((child, idx) => {
                        const childEntity = Entity(
                            Components.Name.create(child.name),
                            Components.Position.create(Util.property(child.position, 'x') || 0, Util.property(child.position, 'y')) || 0,
                            Components.Rotation.create(child.rotation),
                            Components.Scale.create( Util.property(child.scale, 'x') || 1, Util.property(child.scale, 'y')) || 1,
                            Components.Parent.create(entity)
                        );

                        // recursion. shouldn't get too crazy
                        const geometryComponent = this.loadGeometry(child, childEntity);
                        parts[idx] = geometryComponent.data;

                        this.engine.addEntities(childEntity);

                        childrenComponent.data[idx] = childEntity;
                    });

                    component = Components.CompoundBody.create(parts, options);
                    break;
                default:
                    break;
            }

            // @TODO is this necessary? log something if it is?
            if (component) {
                const positionComponent = entity.data.Position;
                const rotationComponent = entity.data.Rotation;
                const scaleComponent = entity.data.Scale;

                Matter.Body.setPosition(component.data, positionComponent.data);
                Matter.Body.setAngle(component.data, rotationComponent.data);
                Matter.Body.scale(component.data, scaleComponent.data.x, scaleComponent.data.y);

                entity.addComponents(component);

                // @TODO constraints need to go in their own config structure and get their own init functions.
                if (actor.geometry.constraints)
                    actor.geometry.constraints.forEach(constraint => constraintQueue.push(Object.assign({ entity: entity }, constraint)));
            }

            return component;
        },
        loadConstraints() {
            constraintQueue.forEach(options => {
                const entity = options.entity;
                const geometryComponentA =
                    entity.data.Polygon ||
                    entity.data.CompoundBody ||
                    entity.data.Rectangle ||
                    entity.data.Circle;

                // bail if there's no geometry component
                if (!geometryComponentA) return;

                options.bodyA = geometryComponentA.data;

                if (options.bodyB) {
                    const entityB = this.engine.entities.find(entity => {
                        const nameComponent = entity.data.Name;
                        return nameComponent && nameComponent.data === options.bodyB;
                    });

                    if (entityB) {
                        const geometryComponent =
                            entityB.data.Polygon ||
                            entityB.data.CompoundBody ||
                            entityB.data.Circle ||
                            entityB.data.Rectangle;
                        if (geometryComponent.data)
                            options.bodyB = geometryComponent.data;
                    }
                }

                delete options.entity;

                this.engine.addEntities(Entity(Components.Constraint.create(options)));
            });
        },
        loadEnvironment() {
            const config = this.config;
            const environment = config.environment;
            const entity = Entity(
                Components.Color.create(environment.background),
                Components.Name.create('Environment')
            );

            environment.forces.forEach(force => {
                let component = Components.Force.create( force.direction, force.magnitude);
                entity.addComponents(component);
            });

            this.engine.addEntities(entity);
        }
    };
}
