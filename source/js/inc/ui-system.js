'use strict';

const Matter = require( 'matter-js' );
const ECS = require( './ecs.js' );
const Util = require( './util.js' );

const Components = ECS.Components;
const System = ECS.System;

/**
 * @param {object}  options                  Key/value set of options
 * @param {object}  options.app              PIXI.application instance
 * @param {object}  options.hub              Turms.Hub instance
 * @param {boolean} options.debug            Debug enabled/disabled
 */
const UISystem = function( options ) {
    let App = options.app;
    let hub = options.hub;
    let debug = !!options.debug;

    const system = Object.create( System, {
        'debug': {
            set( value ) {
                debug = !!value;
            },
            get() {
                return debug;
            }
        },
        'start': {
            value: function() {
                // prototype handles `on` state and event emission
                Object.getPrototypeOf( this ).start.call( this );
                this.registerSubscriptions();
            },
        },
        'registerSubscriptions': {
            value: function() {
                hub.addSubscription( this, 'touch-click' );
            }
        },
        'receiveMessage': {
            value: function( action, message ) {
                switch ( message.type ) {
                    case 'touch-click':
                        // Matter.Body.setPosition( geometryComponent.data, message.data );
                        this.engine.addEntities( ECS.Entity() );
                        console.log('touch-click from uisystem');
                        break;
                    default:
                        break;
                }
            }
        }
    } );

    return system;
};

module.exports = UISystem;
