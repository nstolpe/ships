'use strict'

/**
 * Usage:
 *
 * ```
 * const Emitter = require( './emitter.js' );
 *
 * const emitter = Emitter({
 *   'foo': {
 *       value: 'bar'
 *   }
 * } );
 *
 * let listener = emitter.on( 'foo', function() {
 *     console.log(this.foo);
 * } );
 *
 * emitter.emit( 'foo' );
 * // console output:
 * // bar
 *
 * emitter.off( 'foo', listener );
 * // console output:
 * // [ƒ]
 *
 * emitter.emit( 'foo' );
 * // console output:
 * // undefined
 *
 * const proto = Object.getPrototypeOf( emitter );
 *
 * emitter2 = Object.create( proto, {
 *     'bar': {
 *         value: function() {
 *             console.log( 'in bar' );
 *         }
 *     }
 * } );
 *
 * emitter2.once( 'baz', function( a, b ) {
 *     console.log( a );
 *     console.log( b );
 *     this.bar();
 * } );
 *
 * emitter2.emit( 'baz', 'one', 2 );
 * // console output:
 * // one
 * // 2
 * // in bar
 *
 * emitter2.emit( 'baz', 3, [] );
 * // console output:
 * // undefined
 *
 * ```
 */

// "private" storage for events/listeners
const EventsMap = new WeakMap();

const EmitterProto = Object.create( Object.prototype, {
    /**
     * Sets a function (`listener`) that will be called each time `event` is triggered.
     * Returns the function for use with `off`.
     * @param {string}   event
     * @param {function} listener
     * @return {function}
     */
    'on': {
        value: function( event, listener ) {
            const events = this.events;

            if ( !Array.isArray( events[ event] ) )
                events[ event ] = [];

            events[ event ].push( listener );
            return listener;
        },
        enumerable: true
    },
    /**
     * Stops the calling of the `listener` function each time `event` is triggered.
     * Returns the function.
     * @param {string}   event
     * @param {function} listener
     * @return {function}
     */
    'off': {
        value: function( event, listener ) {
            const events = this.events;
            const listeners = events[ event ]

            if ( Array.isArray( listeners ) ) {
                const idx = listeners.indexOf( listener );
                if ( idx >= 0 )
                    return listeners.splice( idx, 1 );
            }
        },
        enumerable: true
    },
    /**
     * Sets a function (`listener`) to be called only the first time `event` is triggerd.
     * Returns a wrapper function that executes `listener` and deactivates the wrapper.
     * The return value can be used with off before the event has been triggered.
     * @param {string}   event
     * @param {function} listener
     * @return {function}
     */
    'once': {
        value: function( event, listener ) {
            // `this` is set in `emit`
            const oneShot = function() {
                listener.apply( this, arguments );
                this.off( event, oneShot );
            };

            this.on( event, oneShot );
            return oneShot;
        },
        enumerable: true
    },
    /**
     * Triggers `event` and calls any functions that are listening to it.
     * Any arguments after `event` are passed to the listener callback and can be
     * accessed inside it.
     * @param {string} event
     */
    'emit': {
        value: function( event ) {
            const events = this.events;

            if ( Array.isArray( events[ event ] ) ) {
                events[ event ].forEach( listener => {
                    listener.apply( this, [].slice.call( arguments, 1 ) );
                } );
            }
        },
        enumerable: true
    },
    /**
     * Returns all events attached to the emitter.
     */
    'events': {
        get: function() {
            let events = EventsMap.get( this );

            // lets emitter's made Object.assign from a proto work.
            if ( events === undefined ) {
                events = {};
                EventsMap.set( this, {} );
            }

            return events;
        },
        enumerable: true
    }
} );

/**
 * Creates a new Emitter object. Optional `properties` is an array of objects
 * structured as descriptors in the `props` argument of [`Object.defineProperties`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties)
 * @parameter {array} properties
 * @return {object}
 */
const Emitter = function( properties ) {
    const emitter = Object.create( EmitterProto, properties );

    EventsMap.set( emitter, {} );
    return emitter;
};

module.exports = Emitter;
