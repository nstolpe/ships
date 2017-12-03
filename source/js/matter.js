const PIXI = require( 'pixi.js' );
const Turms = require( 'turms' );
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
    Events = Matter.Events,
    Loader = PIXI.loader;

let turtle;
let graphics = new PIXI.Graphics()

window.turtle = turtle;

function loadStage2( config ) {
    config[ 'spritesheets' ].forEach( ( e, i, a ) => {
        Loader.add( `spritesheets::${ e }`, `assets/spritesheets/${ e }.json` );
    } );

    Loader.load( ( loader, resources ) => {
        console.log( 'stage2loaded');
        // console.log( resources[ `spritesheets::assets` ].textures );
    } );
}

Loader
    .add( 'turtle', 'assets/images/turtle.png' )
    .add( 'config', 'assets/data/default.json')
    .load( ( loader, resources ) => {
        turtle = new PIXI.Sprite( resources.turtle.texture );
        turtle.pivot.set( turtle.width * .5, turtle.height * .5 );
        app.stage.addChild( turtle );
        app.stage.addChild( graphics );
        app.ticker.add( animate );

        // 2nd stage loader
        loadStage2( resources.config.data );
    } );

var world = World.create( {
    gravity: { x: 0, y: 0, scale: 0.001 }
} );

// create an engine
var engine = Engine.create( { world: world, positionIterations: 10, velocityIterations: 10 } );

// create a renderer
var render = Render.create( {
    // canvas: document.getElementById( 'view' ),
    element: document.body,
    engine: engine,
    options: {
        showDebug: true,
        showInternalEdges: true,
        showAngleIndicator: true,
        // showAxes: true,
        showVertexNumbers: true,
        showCollisions: true,
        showSeparations: true,
        showBroadphase: true,
        showVelocity: true,
    }
} );

var scale = window.devicePixelRatio;

var app = new PIXI.Application(
    document.body.offsetWidth,
    document.body.offsetHeight,
    {
        view: document.getElementById( 'view' ),
        backgroundColor: 0x25caff,
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
// angle 163
// magnitude .0001
// var forces = [ { x: -0.9563047559630355, y: 0.2923717047227366 } ];
var forces = [ { x: -0.9563047559630355 * .0001, y: 0.2923717047227366 * .0001 } ];

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 120, 120, {
    // restitution: 1,
    label: 'BoxA',
    // density: .2,
    plugin: {
        forces: forces
    }
} );

var boxB = Bodies.rectangle(400, 100, 10, 80, {
    // restitution: 1,
    label: 'BoxB',
    // density: .1,
    plugin: {
        forces: forces
    }
} );

var partA = Bodies.rectangle(200, 560, 10, 80, {
    // restitution: 1,
    label: 'partA',
    // density: .1,
    // plugin: {
    //     forces: forces
    // }
} );

var partB = Bodies.rectangle(240, 560, 80, 10, {
    // restitution: 1,
    label: 'partB',
    // density: .1,
    // plugin: {
    //     forces: forces
    // }
} );

var compound = Matter.Body.create( {
    parts: [ partA, partB ],
    plugin: {
        forces: forces
    }
} );
window.compound = compound;
var shipShape = Bodies.fromVertices( 450, 300,
    [
        { x: 60, y: 19 },
        { x: 56, y: 8  },
        { x: 43, y: 2  },
        { x: 31, y: 0  },
        { x: 17, y: 2  },
        { x: 4, y: 8  },
        { x: 0, y: 19  },
        { x: 0, y: 24  },
        { x: 4, y: 35  },
        { x: 17, y: 41  },
        { x: 31, y: 43  },
        { x: 43, y: 41  },
        { x: 56, y: 35  },
        { x: 60, y: 24  }
    ], {
        restitution: .2,
        friction: .0,
        density: .002,
        label: 'ShipShape',
        plugin: {
            forces: forces
        }
    }
);

var rudder = Bodies.rectangle( 389, 300, 100, 100, {
    label: 'rudder',
    plugin: {
        forces: forces
    }
} );
window.rudder = rudder;
// Matter.Body.scale( shipShape, .5, .5 );
var ground = Bodies.rectangle( 400, 610, 810, 60 );
window.ground = ground;
var ceiling = Bodies.rectangle( 400, -10, 810, 60, { isStatic: true } );
var right = Bodies.rectangle( 800, 300, 200, 610, { isStatic: true } );
var left = Bodies.rectangle( -10, 300, 200, 610, { isStatic: true } );
var rigidBodies = [ ground, ceiling, right, left, boxA, boxB, shipShape, rudder, compound ];
window.boxA = boxA;
window.boxB = boxB;
window.shipShape = shipShape;
window.Matter = Matter;
var composite = Matter.Composite.create();
// Matter.Composite.add( composite, boxA );
// Matter.Composite.add( composite, boxB );
window.constraint = Matter.Constraint.create( {
    bodyA: boxA,
    bodyB: boxB,
    pointA: { x: 0, y: -60 },
    pointB: { x: 0, y: 40 }
} );
window.constraint2 = Matter.Constraint.create( {
    pointB: { x: 0, y: 0 },
    pointA: { x: compound.position.x + 100, y: compound.position.y - 100 },
    bodyB: compound,
    stiffness: 0.1,
    damping: 0.5
} );
window.rudderConstraint0 = Matter.Constraint.create( {
    pointB: {
        x: (rudder.vertices[0].x - rudder.position.x) * .8,
        y: (rudder.vertices[0].y - rudder.position.y) * .8
    },
    pointA: {
        x: rudder.vertices[0].x,
        y: rudder.vertices[0].y
    },
    bodyB: rudder,
    stiffness: 0.1,
    damping: 0.05
} );
window.rudderConstraint1 = Matter.Constraint.create( {
    pointB: {
        x: (rudder.vertices[1].x - rudder.position.x) * .8,
        y: (rudder.vertices[1].y - rudder.position.y) * .8
    },
    pointA: {
        x: rudder.vertices[1].x,
        y: rudder.vertices[1].y
    },
    bodyB: rudder,
    stiffness: 0.1,
    damping: 0.05
} );
window.rudderConstraint2 = Matter.Constraint.create( {
    pointB: {
        x: (rudder.vertices[2].x - rudder.position.x) * .8,
        y: (rudder.vertices[2].y - rudder.position.y) * .8
    },
    pointA: {
        x: rudder.vertices[2].x,
        y: rudder.vertices[2].y
    },
    bodyB: rudder,
    stiffness: 0.1,
    damping: 0.05
} );
window.rudderConstraint3 = Matter.Constraint.create( {
    pointB: {
        x: (rudder.vertices[3].x - rudder.position.x) * .8,
        y: (rudder.vertices[3].y - rudder.position.y) * .8
    },
    pointA: {
        x: rudder.vertices[3].x,
        y: rudder.vertices[3].y
    },
    bodyB: rudder,
    stiffness: 0.1,
    damping: 0.05
} );
// add all of the bodies to the world
World.add( engine.world, [
    boxA, boxB, shipShape, ground, ceiling,
    left, right, constraint, rudder,
    rudderConstraint0,
    rudderConstraint1, rudderConstraint2, rudderConstraint3, compound,
    constraint2
] );

// run the engine
// Engine.run( engine );
app.ticker.add( delta => {
    Matter.Engine.update( engine, app.ticker.elapsedMS )
    // Matter.Engine.update( engine, delta * 16 )
} );


// run the renderer
Render.run( render );

var accelerate = 0;
var turn = 0;
var boost = false;
// W
window.addEventListener( 'keydown', e => {
    if ( e.which === 87 ) accelerate = 1;
}, false );
window.addEventListener( 'keyup', e => {
    if ( e.which === 87 ) accelerate = 0;
}, false );
// S
window.addEventListener( 'keydown', e => {
    if ( e.which === 83 ) accelerate = -1;
}, false );
window.addEventListener( 'keyup', e => {
    if ( e.which === 83 ) accelerate = 0;
}, false );
// A
window.addEventListener( 'keydown', e => {
    if ( e.which === 65 ) turn = -1;
}, false );
window.addEventListener( 'keyup', e => {
    if ( e.which === 65 ) turn = 0;
}, false );
// D
window.addEventListener( 'keydown', e => {
    if ( e.which === 68 ) turn = 1;
}, false );
window.addEventListener( 'keyup', e => {
    if ( e.which === 68 ) turn = 0;
}, false );
// P
window.addEventListener( 'keydown', e => {
    if ( e.which === 80 ) boost = true;
}, false );
// window.addEventListener( 'keyup', e => {
//     if ( e.which === 80 ) turn = 0;
// }, false );

Events.on( engine, "beforeUpdate", ( e ) => {
    if ( accelerate ) {
        // console.log(e);
        let v = Matter.Vector.create(
            Math.cos( shipShape.angle ),
            Math.sin( shipShape.angle ) );
        v = Matter.Vector.normalise( v );
        v = Matter.Vector.mult( v, .0004 * accelerate );
        Matter.Body.applyForce( shipShape, shipShape.position, v )
    }
    if ( boost ) {
        let v = Matter.Vector.create( Math.cos( shipShape.angle ), Math.sin( shipShape.angle ) );
        Matter.Body.applyForce( shipShape, shipShape.position, Matter.Vector.mult( v, .2 ) );
        boost = false;
    }
    if ( turn ) {
        shipShape.torque = turn * .003;
    }
} );
