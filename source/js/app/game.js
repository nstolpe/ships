"use strict";

const PIXI = require('pixi.js');
const decomp = require('poly-decomp');
const ActivateInputs = require('app/activate-inputs.js');
const Util = require('app/util.js');
const ScreenManager = require('app/screen-manager.js');
const Hub = require('turms').Hub;

// matter-js needs `poly-decomp` attached to window or global as decomp
window.decomp = decomp;
// below rely on matter (or are matter), which relies on decomp on window,
// but imports get moved up and requires stay here.
// @TODO consider passing matter to these modules factory methods instead.
// or make everything require.
const Matter = require('matter-js');
const PhysicsSystem = require('app/physics-system.js');
const RenderSystem = require('app/render-system.js');
const PlayerManagerSystem = require('app/player-manager-system.js');
const ECS = require('app/ecs.js');
const Loader = require('app/loaders/loader');
const Entity = ECS.Entity;
const Components = ECS.Components;
const Engine = ECS.Engine;


/**
 * creates a game object based on `options`
 * @TODO document options.
 */
module.exports = function(options) {
    // create a default Matter.Body for use with some calculations.
    let defaultMatter = Matter.Body.create();

    const defaultConfig = {
        spritesheets: [],
        environment: {
            forces:[],
            background: 0x000000
        },
        actors: []
    };

    return {
        id: options.id,
        element: options.element,
        app: null,
        view: null,
        resolution: options.resolution,
        dataPath: 'assets/data',
        config: defaultConfig,
        engine: Engine(),
        loader: null,
        screenManager: null,
        hub: Hub(),
        receiveMessage(action, message) {
            switch (message.type) {
                case 'config-loaded':
                    this.updateConfig(Util.property(message.data, 'config', {}))
                    break;
                case 'assets-loaded':
                    this.startSystems(Util.property(message.data, 'resources', {}));
                    break;
                case 'add-actor':
                    console.log(message);
                    this.engine.addEntities(ECS.Entity(
                        ECS.Components.Circle.create(20),
                        ECS.Components.Graphics.create(),
                        ECS.Components.Fill.create(0xffffff),
                        ECS.Components.Stroke.create(0xff0000, 2),
                        ECS.Components.Rotation.create(0),
                        ECS.Components.Position.create(message.data.positionX, message.data.positionY),
                        ECS.Components.Scale.create(1, 1),
                        ECS.Components.Alpha.create(1),
                        ECS.Components.Tint.create(0xffffff),
                    ));
                    break;
                default:
                    break;
            }
        },
        updateConfig(newconfig) {
            Object.assign(this.config, newconfig);
        },
        /**
         * Entry point, kicks off loading.
         */
        start() {
            this.loader = Loader(this.hub,{
                id: this.id,
                dataPath: this.dataPath
            });

            this.setUpScreen(options);

            this.hub.addSubscription(this, 'config-loaded');
            this.hub.addSubscription(this, 'assets-loaded');
            this.hub.addSubscription(this, 'add-actor');

            this.loader.load();

            return this;
        },
        /**
         * Clears out the parent element, adds a canvas element that will
         * be used by the PIXI application.
         */
        setUpScreen(options) {
            // @TODO move game into component, so this isn't so hackish.
            const view = document.createElement('canvas');
            view.id = 'view';
            view.classList.add('view');
            view.tabIndex = 0;
            this.element.appendChild(view);
            this.view = view;
            // @TODO allow hidef through option, use resolution 1
            // see https://github.com/pixijs/pixi.js/issues/3833
            // move PIXI app stuff to setupPIXI()
            this.app = new PIXI.Application(
                this.view.clientWidth, //* this.resolution,
                this.view.clientHeight, //* this.resolution,
                {
                    view: this.view,
                    resolution: 1,//Math.min(2, this.resolution),
                    autoresize: true
                }
            );
            // instantiate and initialize the screenmanager
            this.screenManager = ScreenManager(Object.assign({ hub: this.hub, app: this.app, debug: false }, options));
        },
        /**
         * Sets up things that need load to be finished first.
         * @TODO last loading step, the entity setup can move to another package.
         */
        startSystems() {
            this.loadEnvironment();
            this.loadActors(this.config.actors);
            this.loadConstraints(this.config.constraints);

            const physicsSystem = PhysicsSystem({ hub: this.hub });
            const renderSystem = RenderSystem({
                app: this.app,
                backgroundColor: this.getEnvironment().data.Color.data,
                // backgroundColor: this.getEnvironment().components.find(component => component.is(Components.Color)).data,
                graphics: new PIXI.Graphics(),
                hub: this.hub,
                // debug: true
            });
            const playerManagerSystem = PlayerManagerSystem({ hub: this.hub });

            this.engine.addSystems(playerManagerSystem, physicsSystem, renderSystem);

            physicsSystem.start();
            renderSystem.start();
            playerManagerSystem.start();

            // engine updates are trigerred by pixi ticker.
            this.app.ticker.add(this.engine.update.bind(this.engine));
            // activates all inputs
            ActivateInputs.activate(this.hub);
        },
        /**
         * Returns the environment entity.
         * @TODO entity stuff
         */
        getEnvironment() {
            // finds the first environment entity
            const envFinder = e => {
                return !!(e.components.find(component => component.is(Components.Name) && component.data === 'Environment'));
            };
            const environment = this.engine.entities.find(envFinder);
            return environment;
        },
        /**
         * Sets up everything for the actors from the config.
         * @param actors {array}  An array of actor objects.
         */
        loadActors(actors) {
            actors.forEach((actor) => {
                // create a basic entity for the actor
                const entity = Entity(
                    Components.Name.create(actor.name),
                    Components.Position.create(Util.property(actor.position, 'x') || 0, Util.property(actor.position, 'y')) || 0,
                    Components.Rotation.create(actor.rotation),
                    Components.Scale.create(Util.property(actor.scale, 'x') || 1 , Util.property(actor.scale, 'y')) || 1
                );

                this.loadGeometry(actor, entity);

                if (actor.manager === 'player')
                    entity.addComponents(Components.PlayerManager.create());

                // if the actor has display data, load it
                if (actor.geometry.display)
                    this.loadSkinning(actor, entity);

                this.engine.addEntities(entity);
            });
        },
        /**
         * Creates renderable components for an actor.
         * Visual components store PIXI Sprites, Graphics, etc.
         * @param actor {object}   An actor object @TODO document actor.
         * @param entity {object}  An `ECS.Entity` that will receive visual component(s).
         */
        loadSkinning(actor, entity) {
            const type = Util.property(actor.geometry, 'display.type');
            let skinningComponent;
            let texture;
            let fillComponent;
            let strokeComponent;
            let radiusComponent;

            switch (type) {
                case 'sprite':
                    texture = this.loader.getTexture(
                        Util.property(actor.geometry, 'display.spritesheet'),
                        Util.property(actor.geometry, 'display.id')
                    );
                    skinningComponent = Components.Sprite.create(texture);
                    break;
                case 'tiling-sprite':
                    texture = this.loader.getTexture(
                        Util.property(actor.geometry, 'display.spritesheet'),
                        Util.property(actor.geometry, 'display.id')
                    );
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

            // set interactive to true. @TODO should be configurable. default on in editor.
            skinningComponent.data.interactive = true;
            skinningComponent.data.cursor = 'pointer';
            // @TODO allow configurable pivot.
            skinningComponent.data.pivot.set(skinningComponent.data.width * 0.5, skinningComponent.data.height * 0.5);
            // @TODO geometry and visuals need to be separate in config, w/ independent scales.
            skinningComponent.data.scale.set(
                ((val = Util.property(actor.geometry, 'display.scale.x')) => val != null ? val : 1)(),
                ((val = Util.property(actor.geometry, 'display.scale.y')) => val != null ? val : 1)()
            );

            entity.addComponents(
                skinningComponent,
                Components.Alpha.create(actor.alpha != null ? actor.alpha : 1),
                Components.Tint.create(actor.tint != null ? actor.tint: 0xffffff)
            );

            return skinningComponent;
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
                const collisionKeys = ['category', 'mask', 'group'];

                // maybe switch to js for config so hex ints don't need to be converted from strings.
                Object.keys(actor.geometry.collisionFilter).forEach( filterProp => {
                    if (collisionKeys.indexOf(filterProp) >= 0)
                        actor.geometry.collisionFilter[filterProp] = parseInt(actor.geometry.collisionFilter[filterProp], 16);
                });

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
            }

            return component;
        },
        /**
         * Creates entities from an array of constraint configurations.
         */
        loadConstraints(constraints) {
            constraints.forEach(constraint => {
                const options = {};
                if (constraint.bodyA) {
                    const entityA = this.engine.entities.find(entity => entity.data.Name.data === constraint.bodyA );

                    if (entityA) {
                        const geometryComponent =
                            entityA.data.Polygon ||
                            entityA.data.CompoundBody ||
                            entityA.data.Circle ||
                            entityA.data.Rectangle;
                        constraint.bodyA = geometryComponent.data;
                        options.bodyA = geometryComponent.data;
                    }
                }
                if (constraint.bodyB) {
                    const entityB = this.engine.entities.find(entity => entity.data.Name.data === constraint.bodyB );

                    if (entityB) {
                        const geometryComponent =
                            entityB.data.Polygon ||
                            entityB.data.CompoundBody ||
                            entityB.data.Circle ||
                            entityB.data.Rectangle;
                        constraint.bodyB = geometryComponent.data;
                        options.bodyB = geometryComponent.data;
                    }
                }

                this.engine.addEntities(Entity(Components.Constraint.create(constraint)));
            });
        },
        loadEnvironment() {
            const environment = Util.property(this.config, 'environment');
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
