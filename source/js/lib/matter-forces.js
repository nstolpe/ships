"use strict";

const Matter = require('matter-js');

/**
 * An attractors plugin for matter.js.
 * See the readme for usage and examples.
 * @module MatterAttractors
 */
const MatterForces = {
  // plugin meta
  name: 'matter-forces', // PLUGIN_NAME
  version: '0.0.1', // PLUGIN_VERSION
  for: 'matter-js@^0.13.0',

  // installs the plugin where `base` is `Matter`
  // you should not need to call this directly.
  install: function( base ) {
    base.after( 'Body.create', function() {
      MatterForces.Body.init( this );
    } );

    base.before( 'Engine.update', function(engine ) {
      MatterForces.Engine.update( engine );
    } );
  },

  Body: {
    /**
     * Initialises the `body` to support attractors.
     * This is called automatically by the plugin.
     * @function MatterAttractors.Body.init
     * @param {Matter.Body} body The body to init.
     * @returns {void} No return value.
     */
    init: function( body ) {
      body.plugin.forces = body.plugin.forces || [];
    }
  },

  Engine: {
    /**
     * Applies all attractors for all bodies in the `engine`.
     * This is called automatically by the plugin.
     * @function MatterAttractors.Engine.update
     * @param {Matter.Engine} engine The engine to update.
     * @returns {void} No return value.
     */
    update: function( engine ) {
      let world = engine.world,
        bodies = Matter.Composite.allBodies( world );

      for( let i = 0; i < bodies.length; i += 1 ) {
        let body = bodies[ i ],
          forces = body.plugin.forces;

        for( let ii = 0; ii < forces.length; ii++ ) {
          Matter.Body.applyForce( body, body.position, forces[ ii ] );
        }
      }

    }
  }
};

Matter.Plugin.register(MatterForces);

module.exports = MatterForces;

/**
 * @namespace Matter.Body
 * @see http://brm.io/matter-js/docs/classes/Body.html
 */

/**
 * This plugin adds a new property `body.plugin.attractors` to instances of `Matter.Body`.
 * This is an array of callback functions that will be called automatically
 * for every pair of bodies, on every engine update.
 * @property {Function[]} body.plugin.attractors
 * @memberof Matter.Body
 */

/**
 * An attractor function calculates the force to be applied
 * to `bodyB`, it should either:
 * - return the force vector to be applied to `bodyB`
 * - or apply the force to the body(s) itself
 * @callback AttractorFunction
 * @param {Matter.Body} bodyA
 * @param {Matter.Body} bodyB
 * @returns {Vector|undefined} a force vector (optional)
 */
