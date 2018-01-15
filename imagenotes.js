document.body.innerHTML = '';
const view = document.body.appendChild( document.createElement( 'canvas' ) );
view.width = 1000;
view.height = 1000;
const ctx = view.getContext( '2d' );
function draw( ctx, points, background ) {
    // get canvas imageData
    const pixels = ctx.getImageData( 0, 0, ctx.canvas.height, ctx.canvas.width );
    points = points || [];
    console.log(background);
    for( let i = 0, l = pixels.data.length; i < l ; i += 4 ) {
        let color = Array.isArray( background ) ? background.slice(0) : [ 255, 255, 255 ];
        // get xy coords of current pixel
        let xy = {
            x: ( i / 4 ) % ctx.canvas.width,
            y: Math.floor( ( i / 4 ) / ctx.canvas.width )
        };
        for( let ii = 0, ll = points.length; ii < ll; ii++ ) {
            let point = Object.assign( {
                position: { x: 0, y: 0 },
                circumference: 0,
                color: [ 0, 0, 0 ]
            }, points[ ii ] );

            let distance = Math.sqrt( Math.pow( point.position.x - xy.x, 2 ) + Math.pow( point.position.y - xy.y, 2 ) );

            if( distance <= point.circumference ) {
                let pointVal = map( [0, point.circumference ], [0,1], distance );
                color[0] -= ( color[0] - point.color[0] ) * ( 1 - pointVal );
                color[1] -= ( color[1] - point.color[1] ) * ( 1 - pointVal );
                color[2] -= ( color[2] - point.color[2] ) * ( 1 - pointVal );
            }
        }

        pixels.data[ i ] = Math.min( color[0], 255 );
        pixels.data[ i + 1 ] = Math.min( color[1], 255 );
        pixels.data[ i + 2 ] = Math.min( color[2], 255 );
        pixels.data[ i + 3 ] = 255;
        //pixels.data[ i + 3 ] = 255;
    }

    ctx.putImageData( pixels, 0, 0 );
}

function map( source, target, n ) {
    if( source[0] === source[1] ) return console.warn( '0 source range' );
    if( target[0] === target[1] ) return console.warn( '0 target range' );
    return ( n - source[0] ) * ( target[1] - target[0] ) / ( source[1] - source[0] ) + target[0];
}

draw( ctx, [ {
    position: { x: 47, y: 654 },
    circumference: 186,
    color: [78,234,234]
},
{
    position: { x: 358, y: 229 },
    circumference: 200,
    color: [31,255,245]
},
{
    position: { x: 380, y: 36 },
    circumference: 164,
    color: [180,255,252]
},
{
    position: { x: 423, y: 398 },
    circumference: 400,
    color: [42,250,238]
},
{
    position: { x: 167, y: 306 },
    circumference: 150,
    color: [0,220,255]
},
{
    position: { x: 684, y: 699 },
    circumference: 500,
    color: [174,255,233]
}], [
    31,
    203,
    255
] );

function drawGL() {
    const canvas = document.getElementById('view');
    let gl = canvas.getContext('webgl');

    if (!gl)
        return console.log('Unable to intialize WebGL.');

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

