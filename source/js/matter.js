const PIXI = require( 'pixi.js' );
const decomp = require('poly-decomp');
window.decomp = decomp;
const Matter = require( 'matter-js' );
const MatterAttractors = require( 'matter-attractors' );
const MatterForces = require( './inc/matter-forces' );
// Matter.use( 'matter-attractors' );
Matter.use( 'matter-forces' );

var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies;

var world = World.create( {
    gravity: { x: 0, y: 0, scale: 0.001 }
} );

// create an engine
var engine = Engine.create( { world: world } );

// create a renderer
var render = Render.create({
    canvas: document.getElementById( 'view' ),
    engine: engine
});

var forces = [ { x: 0.0001, y: 0.00004 } ];

var current = function( a, b ) {
    Matter.Body.applyForce( a, { x: a.position.x * .8, y: a.position.x * .8 }, { x: 0.001, y: 0.003 } );
}
// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 120, 120, {
    // restitution: 1,
    label: 'BoxA',
    // density: .2,
    plugin: {
        attractors: [
            current
        ],
        forces: forces
    }
} );

var boxB = Bodies.rectangle(450, 50, 80, 80, {
    // restitution: 1,
    label: 'BoxB',
    // density: .1,
    plugin: {
        attractors: [
            current
        ],
        forces: forces
    }
} );

var shipShape = Bodies.fromVertices( 450, 300,
    [
        { x: 38, y: 0 },
        { x: 15, y: 7 },
        { x: 3, y: 33 },
        { x: 0, y: 58 },
        { x: 3, y: 87 },
        { x: 15, y: 113 },
        { x: 38, y: 120 },
        { x: 48, y: 120 },
        { x: 71, y: 113 },
        { x: 83, y: 87 },
        { x: 86, y: 58 },
        { x: 83, y: 33 },
        { x: 71, y: 7 },
        { x: 48, y: 0 }
    ], {
        // restitution: 1,
        // density: .1,
        label: 'ShipShape',
        plugin: {
            attractors: [
                current
            ],
            forces: forces
        }
    }
);

var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
var ceiling = Bodies.rectangle(400, -10, 810, 60, { isStatic: true });
var left = Bodies.rectangle(810, 300, 60, 610, { isStatic: true });
var right = Bodies.rectangle(-10, 300, 60, 610, { isStatic: true });
window.boxA = boxA;
window.boxB = boxB;
window.Matter = Matter;

// add all of the bodies to the world
World.add( engine.world, [ boxA, boxB, shipShape, ground, ceiling, left, right ] );

// run the engine
Engine.run( engine );

// run the renderer
Render.run( render );
