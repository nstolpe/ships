'use strict';

const UiMenu = require('app/dom/ui-menu');

let menu;
/**
 * @param {object}  options                  Key/value set of options
 * @param {object}  options.hub              Turms.Hub instance
 * @param {boolean} options.debug            Debug enabled/disabled
 * @param {object}  options.viewProperties   HTML attributes that will be applied to the PIXI canvas (id, className, style, etc.)
 * @param {string}  options.wrapperSelector  CSS selector of the element the application canvas will be created in.
 * @param {object}  options.element          DOM element that will be parent of the application's canvas and gui layers
 */
const ScreenManager = function(options) {
    let hub = options.hub;
    let debug = !!options.debug;
    let app = options.app;
    // let menu = document.createElement('div');

    UiMenu({ hub });
    if (!app)
        throw new Error('No PIXI.Application found', 'The `ScreenManager` requires an instance of PIXI.Application');

    const manager = {
        view: null,
        element: options.element,
        debug: options.debug,
        openMenu({ worldX, worldY, clientX, clientY }) {
            let left = clientX;
            let top = clientY;

            if (menu) {
            } else {
                menu = document.createElement('ui-menu');
                menu.dataset.worldX = worldX;
                menu.dataset.worldY = worldY;
                this.element.appendChild(menu);
            }

            if (left + parseInt(getComputedStyle(menu).width, 10) > parseInt(getComputedStyle(this.element).width, 10))
                left = parseInt(getComputedStyle(this.element).width, 10) - parseInt(getComputedStyle(menu).width, 10);
            if (top + parseInt(getComputedStyle(menu).height, 10) > parseInt(getComputedStyle(this.element).height, 10))
                top = parseInt(getComputedStyle(this.element).height, 10) - parseInt(getComputedStyle(menu).height, 10);
            menu.style.left = left + 'px';
            menu.style.top = top + 'px';
        },
        receiveMessage(action, message) {
            switch (message.type) {
                case 'right-click':
                    // Matter.Body.setPosition(geometryComponent.data, message.data);
                    // this.engine.addEntities(ECS.Entity(
                    //     ECS.Components.Circle.create(20),
                    //     ECS.Components.Graphics.create(),
                    //     ECS.Components.Fill.create(0xffffff),
                    //     ECS.Components.Stroke.create(0xff0000, 2),
                    //     ECS.Components.Rotation.create(0),
                    //     ECS.Components.Position.create(message.data.position.x, message.data.position.y),
                    //     ECS.Components.Scale.create(1, 1),
                    //     ECS.Components.Alpha.create(1),
                    //     ECS.Components.Tint.create(0xffffff),
                    //));
                    this.openMenu(message.data);
                    break;
                default:
                    break;
            }
        },
        addSubscription(type, action) {
            hub.addSubscription(this, type, action);
        },
        addSubscriptions(subscriptions) {
            subscriptions.forEach(s => this.addSubscription(s.type, s.action))
        }
    };

    // pass subscriptions on instantiation?
    manager.addSubscription('right-click');

    return manager;
};

module.exports = ScreenManager;
