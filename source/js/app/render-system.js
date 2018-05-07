'use strict';

const ECS = require('./ecs.js');
const Util = require('./util.js');

const Components = ECS.Components;
const System = ECS.System;

/**
 * @param {object} options                  Key/value set of options
 * @param {object} options.app              PIXI.application instance
 * @param {object} options.backgroundColor  ECS.Components.Color instance
 * @param {object} options.hub              Turms.Hub instance
 */
const RenderSystem = function(options) {
    let App = options.app;
    let graphics = options.graphics;
    let hub = options.hub;
    let debug = !!options.debug;
    let renderables;
    let player;
    let constraints;

    App.renderer.backgroundColor = options.backgroundColor == null ? 0x000000 : options.backgroundColor;

    const system = Object.create(System, {
        'debug': {
            set(value) {
                debug = !!value;
            },
            get() {
                return debug;
            }
        },
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf(this).start.call(this);
                this.setEntities();
                const renderables = this.entities.renderables();
                const player = this.entities.player();

                // get visual and transform data and create a child for the `PIXI.application` stage
                // @TODO only handles Sprites. needs at support TilingSprite and other possibilities.
                // `compound` visuals will work as they'll be individual components
                renderables.forEach(renderable => {
                    // @TODO better entity api
                    // const spriteComponent = renderable.data.Container ||
                    //     renderable.data.Sprite ||
                    //     renderable.data.Graphics ||
                    //     renderable.data.TilingSprite;

                    // // spriteComponent.data.pivot.set(spriteComponent.data.width * 0.5, spriteComponent.data.height * 0.5);

                    // if (!renderable.components.find(component => component.is(Components.Parent)))
                    //     this.updateRenderable(renderable);

                    // App.stage.addChild(spriteComponent.data);
                });

                App.stage.addChild(graphics);

                // Set stage to player position
                // @TODO this should happen somewhere else, won't always use player. callback?
                // also needs to be reused at other times...resize at least
                if (player) {
                    const positionComponent = player.components.find(component => component.is(Components.Position));
                    if (positionComponent) {
                        App.stage.position.x = (App.renderer.width / App.renderer.resolution) / 2;
                        App.stage.position.y = (App.renderer.height / App.renderer.resolution) / 2;
                        App.stage.pivot.x = positionComponent.data.x;
                        App.stage.pivot.y = positionComponent.data.y;
                    }
                }
                App.stage.rotation = player.data.Rotation.data;
                App.stage.interactive = true;
                let bounds = App.stage.getBounds();
                App.stage.hitArea = new PIXI.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
                App.stage.addListener('pointerdown', e => {
                    console.log('pointerdown ' + e.data.originalEvent.which);
                    if (e.data.originalEvent.which === 3) {
                        if (e.target === e.currentTarget) {
                            const bounds = e.data.originalEvent.target.getBoundingClientRect();
                            const renderPosition = e.data.getLocalPosition(App.stage);
                            hub.sendMessage({
                                type: 'right-click',
                                data: {
                                    clientX: e.data.originalEvent.clientX - bounds.left,
                                    clientY: e.data.originalEvent.clientY - bounds.top,
                                    worldX: renderPosition.x,
                                    worldY: renderPosition.y
                                }
                            });
                        }
                    }
                });
                // better checking?
                if (typeof hub === 'object')
                    this.registerSubscriptions();

                // App.ticker.add(this.update.bind(this));
            }
        },
        /**
         * Resizes the canvas if its `clientWidth` doesn't equal it's `width` or if its
         * `clientHeight` doesn't equal its `height`
         */
        'resize': {
            value: function() {
                if (App.view.width != App.view.clientWidth || App.view.height !== App.view.clientHeight) {
                    App.renderer.resize(
                        App.view.clientWidth * App.renderer.resolution,
                        App.view.clientHeight * App.renderer.resolution
                   );
                    // @TODO as above in `start()`, this should be configurable and should be
                    // broken out for reuse.
                    if (this.entities.player()) {
                        const positionComponent = this.entities.player().data.Position;
                        if (positionComponent) {
                            App.stage.position.x = (App.renderer.width / App.renderer.resolution) / 2;
                            App.stage.position.y = (App.renderer.height / App.renderer.resolution) / 2;
                            App.stage.pivot.x = positionComponent.data.x;
                            App.stage.pivot.y = positionComponent.data.y;
                        }
                    }
                }
            }
        },
        'update': {
            value: function(delta) {
                // console.log('update render');
                const renderables = this.entities.renderables();

                this.resize();

                renderables.forEach(renderable => this.updateRenderable(renderable));

                // keeps the camera centerd on the player
                const player = this.entities.player();
                const positionComponent = player.components.find(component => component.is(Components.Position));
                App.stage.pivot.x = positionComponent.data.x;
                App.stage.pivot.y = positionComponent.data.y;

                // @TODO draw anything, besides debug, that needs to be drawn by graphics
                // @TODO generate graphics if it's not there
                if (typeof graphics.clear === 'function') {
                    graphics.clear();
                    if (this.debug)
                        this.drawDebug(renderables);
                }
            }
        },
        'updateRenderable': {
            value: function(renderable) {
                const geometryComponent =
                    renderable.data.Polygon ||
                    renderable.data.CompoundBody ||
                    renderable.data.Rectangle ||
                    renderable.data.Circle;
                const spriteComponent =
                    renderable.data.TilingSprite ||
                    renderable.data.Container ||
                    renderable.data.Graphics ||
                    renderable.data.Sprite;
                const parentComponent = renderable.data.Parent;

                    // not sure why, but outlines don't match up to sprite (so physics and sprite are off too)
                    // if the position Component is used here. so using geometryCompment instead
                    // rotation Component is needed though, value from geometry gets weird.
                    spriteComponent.data.position.x = geometryComponent.data.position.x;
                    spriteComponent.data.position.y = geometryComponent.data.position.y;
                    // spriteComponent.data.scale.x = renderable.data.Scale.data.x;
                    // spriteComponent.data.scale.y = renderable.data.Scale.data.y;
                    spriteComponent.data.alpha = renderable.data.Alpha.data;
                    spriteComponent.data.tint = renderable.data.Tint.data;

                    if (spriteComponent.is(Components.Graphics)) {
                        spriteComponent.data.clear();

                        if (renderable.data.Fill.data)
                            spriteComponent.data.beginFill(renderable.data.Fill.data);

                        if (renderable.data.Stroke.data)
                            spriteComponent.data.lineStyle(renderable.data.Stroke.data.width, renderable.data.Stroke.data.color, renderable.data.Alpha.data);

                        switch (Object.getPrototypeOf(geometryComponent)) {
                            case Components.Circle:
                                spriteComponent.data.drawCircle(0, 0, geometryComponent.data.circleRadius - renderable.data.Stroke.data.width * 0.5);
                                break;
                            case Components.Rectangle:
                                const strokeWidth = Util.property(renderable.data, 'Stroke.data.width') || 0;
                                const halfStroke = strokeWidth * 0.5 || 0;
                                const vertices = Util.property(geometryComponent.data, 'vertices');

                                let wDiff = vertices[0].x - vertices[1].x;
                                let hDiff = vertices[0].y - vertices[1].y;
                                let width = Math.sqrt(wDiff * wDiff + hDiff * hDiff);
                                wDiff = vertices[0].x - vertices[3].x;
                                hDiff = vertices[0].y - vertices[3].y;
                                let height = Math.sqrt(wDiff * wDiff + hDiff * hDiff);
                                spriteComponent.data.drawRect(halfStroke - width * 0.5 , halfStroke - height * 0.5, width - strokeWidth, height - strokeWidth);
                                break;
                            case Components.Polygon:
                                break;
                            case Components.CompoundBody:
                                break;
                        }

                        if (renderable.data.Fill.data)
                            spriteComponent.data.endFill();
                    }
                    // rotation updates should come from parent geometry if this is a child renderable/component
                    if (parentComponent) {
                        const parent = parentComponent.data;
                        spriteComponent.data.rotation = parent.data.Rotation.data;
                    } else {
                        spriteComponent.data.rotation = renderable.data.Rotation.data;
                    }
            }
        },
        'drawDebug': {
            value: function(entities) {
                // Draws bounding shapes.
                entities.forEach(entity => {
                    const geometryComponent = entity.components.find(component => component.is(Components.Polygon)) ||
                        entity.components.find(component => component.is(Components.CompoundBody)) ||
                        entity.components.find(component => component.is(Components.Rectangle)) ||
                        entity.components.find(component => component.is(Components.Circle));

                        switch (true) {
                            case geometryComponent.is(Components.Rectangle):
                            case geometryComponent.is(Components.Polygon):
                                graphics.lineStyle(1, 0x9dffb7, 1);
                                geometryComponent.data.vertices.forEach((vertex, idx, vertices) => {
                                    switch (idx) {
                                        case 0:
                                            graphics.moveTo(vertex.x, vertex.y);
                                            break;
                                        case vertices.length - 1:
                                            graphics.lineTo(vertex.x,vertex.y);
                                            graphics.lineTo(vertices[0].x, vertices[0].y);
                                            break;
                                        default:
                                            graphics.lineTo(vertex.x,vertex.y);
                                            break;
                                    }
                                });
                                break;
                            case geometryComponent.is(Components.Circle):
                                graphics.lineStyle(1, 0x9dffb7, 1);
                                graphics.drawCircle(
                                    geometryComponent.data.position.x,
                                    geometryComponent.data.position.y,
                                    geometryComponent.data.circleRadius
                               );
                                break;
                            case geometryComponent.is(Components.Container):
                            defaut:
                                break;
                        }
                });

                graphics.lineStyle(1, 0xff0000, 1);

                this.entities.constraints().forEach(constraintEntity => {
                    let constraint = constraintEntity.data.Constraint.data;
                    if (constraint.bodyA) {
                        graphics.moveTo(constraint.bodyA.position.x + constraint.pointA.x, constraint.bodyA.position.y + constraint.pointA.y);
                    } else {
                        graphics.moveTo(constraint.pointA.x, constraint.pointA.y);
                    }
                    if (constraint.bodyB) {
                        graphics.lineTo(constraint.bodyB.position.x + constraint.pointB.x, constraint.bodyB.position.y + constraint.pointB.y);
                    } else {
                        graphics.lineTo(constraint.pointB.x, constraint.pointB.y);
                    }
                });
            }
        },
        'registerSubscriptions': {
            value: function() {
                hub.addSubscription(this, 'get-renderable-entities');
                hub.addSubscription(this, 'zoom');
                hub.addSubscription(this, 'collision-start');
                hub.addSubscription(this, 'collision-end');
            }
        },
        'receiveMessage': {
            // action will probably be deprecated in turms.
            value: function(action, message) {
                switch (message.type) {
                    // returns renderable entities. unused.
                    case 'get-renderable-entities':
                        hub.sendMessage({
                            type: 'renderable-entities',
                            data: this.entities.renderables
                        });
                        break;
                    // handles zoom
                    // scale locked at .25 and 2.5. @TODO make configurable
                    case 'zoom':
                        let scale = App.stage.scale.x + message.data;
                        if (scale > 2.5) scale = 2.5;
                        if (scale < .25) scale = .25;

                        App.stage.scale.set(scale, scale);
                        break;
                    case 'collision-start':
                        // this is better than checking the labels, but these hex numbers should be stored somewhere
                        if ((message.data.bodyA.collisionFilter.category === 0x000002 && message.data.bodyB.collisionFilter.category === 0x000020) ||
                            (message.data.bodyB.collisionFilter.category === 0x000002 && message.data.bodyA.collisionFilter.category === 0x000020)) {
                            let target;
                            let spriteComponent;

                            if (message.data.bodyA.label === 'player')
                                target = this.engine.entities.find(entity => entity.data.Name.data === message.data.bodyB.label);
                            else
                                target = this.engine.entities.find(entity => entity.data.Name.data === message.data.bodyA.label);

                            spriteComponent =
                                target.data.TilingSprite ||
                                target.data.Container ||
                                target.data.Sprite;

                            // spriteComponent.data.alpha = 0.5;
                            target.data.Alpha.data = 0.5;
                        }
                        break;
                    case 'collision-end':
                        if ((message.data.bodyA.collisionFilter.category === 0x000002 && message.data.bodyB.collisionFilter.category === 0x000020) ||
                            (message.data.bodyB.collisionFilter.category === 0x000002 && message.data.bodyA.collisionFilter.category === 0x000020)) {
                            let target;
                            let spriteComponent;

                            if (message.data.bodyA.label === 'player')
                                target = this.engine.entities.find(entity => entity.data.Name.data === message.data.bodyB.label);
                            else
                                target = this.engine.entities.find(entity => entity.data.Name.data === message.data.bodyA.label);

                            spriteComponent =
                                target.data.TilingSprite ||
                                target.data.Container ||
                                target.data.Sprite;

                            // spriteComponent.data.alpha = 0.25;
                            target.data.Alpha.data = 0.25;
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    });

    // attach entity getter functions here.
    Object.assign(system.entities, {
        renderables(refresh) {
            if (!renderables) {
                renderables = system.engine.entities.filter(entity => {
                    return entity.data.Position &&
                           entity.data.Rotation &&
                           entity.data.Scale &&
                           (entity.data.Container ||
                             entity.data.Sprite ||
                             entity.data.TilingSprite ||
                             entity.data.Graphics);
                });

                renderables.forEach(renderable => {
                    const spriteComponent = renderable.data.Container ||
                        renderable.data.Sprite ||
                        renderable.data.Graphics ||
                        renderable.data.TilingSprite;

                    if (!renderable.components.find(component => component.is(Components.Parent)))
                        system.updateRenderable(renderable);

                    App.stage.addChild(spriteComponent.data);
                });
            } else if (refresh) {
                const refreshed = system.engine.entities.filter(entity => {
                    return entity.data.Position &&
                           entity.data.Rotation &&
                           entity.data.Scale &&
                           (entity.data.Container ||
                             entity.data.Sprite ||
                             entity.data.TilingSprite ||
                             entity.data.Graphics);
                });

                refreshed.forEach(ref => {
                    if (renderables.indexOf(ref) < 0) {
                        const spriteComponent = ref.data.Container ||
                            ref.data.Sprite ||
                            ref.data.Graphics ||
                            ref.data.TilingSprite;

                        if (!ref.components.find(component => component.is(Components.Parent)))
                            system.updateRenderable(ref);

                        App.stage.addChild(spriteComponent.data);
                    }
                });

                renderables.forEach(renderable => {
                    if (refreshed.indexOf(renderable) < 0) {
                        const spriteComponent = renderable.data.Container ||
                            renderable.data.Sprite ||
                            renderable.data.Graphics ||
                            renderable.data.TilingSprite;

                        if (!renderable.components.find(component => component.is(Components.Parent)))
                            system.updateRenderable(renderable);

                        App.stage.removeChild(spriteComponent.data);
                    }
                });

                renderables = refreshed;
            }

            return renderables;
        },
        constraints(refresh) {
            if (refresh || !constraints)
                constraints = system.engine.entities.filter(entity => !!entity.data.Constraint);
            return constraints;
        },
        // @TODO consolidate to something composable that player-manager-system can also use.
        player(refresh) {
            if (refresh || !player) {
                player = system.entities.renderables().find(entity => {
                    return entity.components.find(component => component.is(Components.PlayerManager));
                });
            }

            return player;
        }
    });


    return system;
}

module.exports = RenderSystem;