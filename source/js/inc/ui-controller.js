'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ECS = require('./ecs.js');

/**
 * @param {object}  options                  Key/value set of options
 * @param {object}  options.hub              Turms.Hub instance
 * @param {boolean} options.debug            Debug enabled/disabled
 */
const UIController = function(options) {
    let hub = options.hub;
    let debug = !!options.debug;
    const wrapper = document.getElementById('view-wrapper');

    const controller = Object.create( Object.prototype, {
        'debug': {
            set(value) {
                debug = !!value;
            },
            get() {
                return debug;
            }
        },
        'init': {
            value: function() {
                this.registerSubscriptions();
                // draw some react debug ui stuff.
            }
        },
        'registerSubscriptions': {
            value: function() {
                hub.addSubscription(this, 'touch-click');
            }
        },
        'openMenu': {
            value: function(x, y) {
                let menu = document.getElementById('menu');
                let left = x;
                let top = y;

                if (menu) {

                } else {
                    menu = document.createElement('div');
                    menu.id = 'menu';
                    menu.style.backgroundColor = '#ffffff';
                    menu.style.position = 'absolute';
                    menu.style.fontSize = '14px';
                    wrapper.appendChild(menu);
                }


                if (left + parseInt(getComputedStyle(menu).width, 10) > parseInt( getComputedStyle(wrapper).width, 10))
                    left = parseInt(getComputedStyle(wrapper).width, 10) - parseInt( getComputedStyle(menu).width, 10);
                if (top + parseInt(getComputedStyle(menu).height, 10) > parseInt( getComputedStyle(wrapper).height, 10))
                    top = parseInt(getComputedStyle(wrapper).height, 10) - parseInt( getComputedStyle(menu).height, 10);
                menu.style.left = left + 'px';
                menu.style.top = top + 'px';
                ReactDOM.render(
                  <ul className="menu">
                    <li>
                        <li>create</li>
                        <li>
                            <a href="#" onClick={ (e) => console.log('circle') }>circle</a>
                        </li>
                        <li>
                            <a href="#" onClick={ (e) => console.log('rectangle') }>rectangle</a>
                        </li>
                        <li>
                            <a href="#" onClick={ (e) => console.log('polygon') }>polygon</a>
                        </li>
                    </li>
                    <li>two</li>
                  </ul>,
                  menu
                );
            }
        },
        'receiveMessage': {
            value: function(action, message) {
                switch (message.type) {
                    case 'touch-click':
                        // Matter.Body.setPosition( geometryComponent.data, message.data );
                        // this.engine.addEntities( ECS.Entity(
                        //     ECS.Components.Circle.create( 20 ),
                        //     ECS.Components.Graphics.create(),
                        //     ECS.Components.Fill.create( 0xffffff ),
                        //     ECS.Components.Stroke.create( 0xff0000, 2 ),
                        //     ECS.Components.Rotation.create( 0 ),
                        //     ECS.Components.Position.create( message.data.position.x, message.data.position.y ),
                        //     ECS.Components.Scale.create( 1, 1 ),
                        //     ECS.Components.Alpha.create( 1 ),
                        //     ECS.Components.Tint.create( 0xffffff ),
                        // ) );
                        this.openMenu(message.data.ui.x, message.data.ui.y);
                        console.log('touch-click from uisystem');
                        break;
                    default:
                        break;
                }
            }
        }
    } );

    return controller;
};

module.exports = UIController;
