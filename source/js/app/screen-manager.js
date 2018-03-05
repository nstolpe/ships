'use strict';

// import * as React from 'react';
import React from "react";
import ReactDOM from "react-dom";
import { Stage, Graphics, render, Text } from "react-pixi-fiber";
// import { render } from 'react-dom';
import PropTypes from "prop-types";
//@TODO get this out of here
/**
 * @param {object}  options                  Key/value set of options
 * @param {object}  options.hub              Turms.Hub instance
 * @param {boolean} options.debug            Debug enabled/disabled
 * @param {object}  options.viewProperties   HTML attributes that will be applied to the React/PIXI canvas (id, className, style, etc.)
 * @param {string}  options.wrapperSelector  CSS selector of the element the application canvas will be created in.
 * @param {object}  options.element          DOM element that will be parent of the application's canvas and gui layers
 */
const ScreenManager = function(options) {
    let hub = options.hub;
    let debug = !!options.debug;
    let app = options.app;
    let menu = document.createElement('div');

    if (!app)
        throw new Error('No PIXI.Application found', 'The `ScreenManager` requires an instance of PIXI.Application');

    const manager = {
        view: null,
        element: options.element,
        debug: options.debug,
        init() {
            this.registerSubscriptions();
            // this.app = this.context.aoo
            // render(
            //     ,
            //     app.stage
            // );
            return this;
        },
        registerSubscriptions() {
            hub.addSubscription(this, 'touch-click');
        },
        openMenu(x, y) {
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
                this.element.appendChild(menu);
            }


            if (left + parseInt(getComputedStyle(menu).width, 10) > parseInt( getComputedStyle(this.element).width, 10))
                left = parseInt(getComputedStyle(this.element).width, 10) - parseInt( getComputedStyle(menu).width, 10);
            if (top + parseInt(getComputedStyle(menu).height, 10) > parseInt( getComputedStyle(this.element).height, 10))
                top = parseInt(getComputedStyle(this.element).height, 10) - parseInt( getComputedStyle(menu).height, 10);
            menu.style.left = left + 'px';
            menu.style.top = top + 'px';
            ReactDOM.render(
              <ul className="menu">
                <li>create</li>
                <li>
                    <a href="#" onClick={ (e) => { console.log('circle'); e.preventDefault() } }>circle</a>
                </li>
                <li>
                    <a href="#" onClick={ (e) => { console.log('rectangle'); e.preventDefault() } }>rectangle</a>
                </li>
                <li>
                    <a href="#" onClick={ (e) => { console.log('polygon'); e.preventDefault() } }>polygon</a>
                </li>
                <li>two</li>
              </ul>,
              menu
            );
        },
        receiveMessage(action, message) {
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
    };

    return manager;
};

module.exports = ScreenManager;
