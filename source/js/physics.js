'use strict'

const Util = require( './inc/util.js' );
const math = require( 'mathjs' );
const PIXI = require( 'pixi.js' );
const Sprite = PIXI.Sprite;
const loader = PIXI.loader;
const view = document.getElementById('view');
const viewWidth = 1000;
const viewHeight = 800;
const scale = window.devicePixelRatio;
const app = new PIXI.Application( viewWidth, viewHeight, { view: view, backgroundColor : 0x000000 } );

function setup() {
	app.ticker.add( animate );
}

function animate( delta ) {
	console.log( 'animating' );
}

loader
	.add( "assets/spritesheets/ships.json" )
	.load( setup );

var Collision = {
 
    // Elastic collisions refer to the simple cast where
    // two entities collide and a transfer of energy is
    // performed to calculate the resulting speed
    // We will follow Box2D's example of using
    // restitution to represent "bounciness"
 
    elastic: function(restitution) {
        this.restitution = restitution || .2;
    },
 
    displace: function() {
        // While not supported in this engine
           // the displacement collisions could include
        // friction to slow down entities as they slide
        // across the colliding entity
    }
};
 
// The physics entity will take on a shape, collision
// and type based on its parameters. These entities are
// built as functional objects so that they can be
// instantiated by using the 'new' keyword.
 
var PhysicsEntity = function(collisionName, type) {
 
    // Setup the defaults if no parameters are given
    // Type represents the collision detector's handling
    this.type = type || PhysicsEntity.DYNAMIC;
 
    // Collision represents the type of collision
    // another object will receive upon colliding
    this.collision = collisionName || PhysicsEntity.ELASTIC;
 
    // Take in a width and height
    this.width  = 20;
    this.height = 20;
 
    // Store a half size for quicker calculations
    this.halfWidth = this.width * .5;
    this.halfHeight = this.height * .5;
 
    var collision = Collision[this.collision];
    collision.call(this);
 
    // Setup the positional data in 2D
 
    // Position
    this.x = 0;
    this.y = 0;
 
    // Velocity
    this.vx = 0;
    this.vy = 0;
 
    // Acceleration
    this.ax = 0;
    this.ay = 0;
 
    // Update the bounds of the object to recalculate
    // the half sizes and any other pieces
    this.updateBounds();
};
 
// Physics entity calculations
PhysicsEntity.prototype = {
 
    // Update bounds includes the rect's
    // boundary updates
    updateBounds: function() {
        this.halfWidth = this.width * .5;
        this.halfHeight = this.height * .5;
    },
 
    // Getters for the mid point of the rect
    getMidX: function() {
        return this.halfWidth + this.x;
    },
 
    getMidY: function() {
        return this.halfHeight + this.y;
    },
 
    // Getters for the top, left, right, and bottom
    // of the rectangle
    getTop: function() {
        return this.y;
    },
    getLeft: function() {
        return this.x;
    },
    getRight: function() {
        return this.x + this.width;
    },
    getBottom: function() {
        return this.y + this.height;
    }
};
 
PhysicsEntity.KINEMATIC = 'kinematic';
PhysicsEntity.DYNAMIC   = 'dynamic';
PhysicsEntity.DISPLACE = 'displace';
PhysicsEntity.ELASTIC = 'elastic';
