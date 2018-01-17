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
    const wrapper = document.getElementById( 'view-wrapper' );

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
                        const menu = document.getElementById( 'menu' ) || ( () => {
                            const menu = document.createElement( 'div' );
                            menu.id = 'menu';
                            menu.style.width = '100px';
                            menu.style.height = '100px';
                            menu.style.backgroundColor = '#ffffff';
                            menu.style.position = 'absolute';
                            return menu;
                        } )();

                        let left = message.data.ui.x;
                        let top = message.data.ui.y;
                        if ( left + parseInt( getComputedStyle( menu ).width, 10 ) > parseInt( getComputedStyle( wrapper ).width, 10 ) )
                            left = parseInt( getComputedStyle( wrapper ).width, 10 ) - parseInt( getComputedStyle( menu ).width, 10 );
                        if ( top + parseInt( getComputedStyle( menu ).height, 10 ) > parseInt( getComputedStyle( wrapper ).height, 10 ) )
                            top = parseInt( getComputedStyle( wrapper ).height, 10 ) - parseInt( getComputedStyle( menu ).height, 10 );
                        menu.style.left = ( left ) + 'px';
                        menu.style.top = ( top ) + 'px';
                        wrapper.appendChild( menu );
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
