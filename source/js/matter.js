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

let graphics = new PIXI.Graphics()
window.turtle = PIXI.Sprite.fromImage( 'assets/images/turtle.png' );
// app.stage.addChild( graphics );
app.stage.addChild( turtle );

function animate() {
    graphics.clear();
    turtle.position.x = shipShape.position.x;
    turtle.position.y = shipShape.position.y;
    turtle.pivot.x = turtle.width / 2;
    turtle.pivot.y = turtle.height / 2;
    turtle.rotation = shipShape.angle;
    graphics.lineStyle( 1, 0x00ff32, 1 );

    for ( let i = 0, l = shipShape.vertices.length; i < l; i++ ) {
        let vertex = shipShape.vertices[ i ];
        if ( i === 0 )
            graphics.moveTo( vertex.x, vertex.y );
        else  if ( i === l - 1 )
            graphics.lineTo( shipShape.vertices[ 0 ].x, shipShape.vertices[ 0 ].y );
        else
            graphics.lineTo( vertex.x, vertex.y );
    }
}

app.ticker.add( animate );

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

var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
var ceiling = Bodies.rectangle(400, -10, 810, 60, { isStatic: true });
var right = Bodies.rectangle(890, 300, 200, 610, { isStatic: true });
var left = Bodies.rectangle(-10, 300, 200, 610, { isStatic: true });
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
