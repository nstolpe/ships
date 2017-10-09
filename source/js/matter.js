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
    Bodies = Matter.Bodies,
    Loader = PIXI.loader;

let turtle;
let graphics = new PIXI.Graphics()

window.turtle = turtle;

Loader.add( 'turtle', 'assets/images/turtle.png' )
    .load( ( loader, resources ) => {
        turtle = new PIXI.Sprite( resources.turtle.texture );
        turtle.pivot.set( turtle.width * .5, turtle.height * .5 );
        turtle.scale.x *= .75;
        turtle.scale.y *= .75;

        app.stage.addChild( graphics );
        app.stage.addChild( turtle );
        app.ticker.add( animate );
    } );

var world = World.create( {
    gravity: { x: 0, y: 0, scale: 0.001 }
} );

// create an engine
var engine = Engine.create( { world: world, positionIterations: 10, velocityIterations: 10 } );

// create a renderer
var render = Render.create({
    canvas: document.getElementById( 'view' ),
    engine: engine,
    options: {
        showDebug: true,
        showInternalEdges: true,
        showAngleIndicator: true,
        // showAxes: true,
        showVertexNumbers: true,
    }
});

var scale = window.devicePixelRatio;

var app = new PIXI.Application(
    800,
    800,
    {
        view: document.getElementById( 'pixi' ),
        backgroundColor: 0x051224,
        resolution: scale,
        autoResize: true
    }
);

function animate() {
    graphics.clear();
    turtle.position.x = shipShape.position.x;
    turtle.position.y = shipShape.position.y;
    turtle.rotation = shipShape.angle;
    graphics.lineStyle( 1, 0x00ff32, 1 );

    for ( let i = 0, l = rigidBodies.length; i < l; i++ ) {
        let body = rigidBodies[ i ];

        for ( let ii = 0, ll = body.vertices.length; ii <= ll; ii++ ) {
            let vertex = body.vertices[ ii ];
            if ( ii === 0 )
                graphics.moveTo( vertex.x, vertex.y );
            else  if ( ii === ll )
                graphics.lineTo( body.vertices[ 0 ].x, body.vertices[ 0 ].y );
            else
                graphics.lineTo( vertex.x, vertex.y );
        }
    }

}

var forces = [ { x: 0.0001, y: 0.00004 } ];

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 120, 120, {
    // restitution: 1,
    label: 'BoxA',
    // density: .2,
    plugin: {
        forces: forces
    }
} );

var boxB = Bodies.rectangle(450, 50, 80, 80, {
    // restitution: 1,
    label: 'BoxB',
    // density: .1,
    plugin: {
        forces: forces
    }
} );

var shipShape = Bodies.fromVertices( 450, 300,
    [
        { x: 0, y: 38 },
        { x: -7, y: 15 },
        { x: -33, y: 3 },
        { x: -58, y: 0 },
        { x: -87, y: 3 },
        { x: -113, y: 15 },
        { x: -120, y: 38 },
        { x: -120, y: 48 },
        { x: -113, y: 71 },
        { x: -87, y: 83 },
        { x: -58, y: 86 },
        { x: -33, y: 83 },
        { x: -7, y: 71 },
        { x: 0, y: 48 },
    ], {
        // restitution: 1,
        // density: .1,
        label: 'ShipShape',
        plugin: {
            forces: forces
        }
    }
);
Matter.Body.scale( shipShape, .75, .75 );
var ground = Bodies.rectangle( 400, 610, 810, 60, { isStatic: true } );
var ceiling = Bodies.rectangle( 400, -10, 810, 60, { isStatic: true } );
var right = Bodies.rectangle( 800, 300, 200, 610, { isStatic: true } );
var left = Bodies.rectangle( -10, 300, 200, 610, { isStatic: true } );
var rigidBodies = [ ground, ceiling, right, left, boxA, boxB, shipShape ];
window.boxA = boxA;
window.boxB = boxB;
window.shipShape = shipShape;
window.Matter = Matter;

// add all of the bodies to the world
World.add( engine.world, [ boxA, boxB, shipShape, ground, ceiling, left, right ] );

// run the engine
Engine.run( engine );

// run the renderer
Render.run( render );
