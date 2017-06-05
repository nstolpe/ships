const PIXI = require( 'pixi.js' );

console.log('shader');

// Get the screen width and height
var width = 396;
var height = 396;
// var width = window.innerWidth;
// var height = window.innerHeight;
// Chooses either WebGL if supported or falls back to Canvas rendering
var renderer = new PIXI.autoDetectRenderer( width, height );
// Add the render view object into the page
document.body.appendChild( renderer.view );

// The stage is the root container that will hold everything in our scene
var stage = new PIXI.Container();

// Load an image and create an object
var source = PIXI.Sprite.fromImage( "/assets/images/boxes-blue-red.png" );
// Set it at the center of the screen
source.x = width / 2;
source.y = height / 2;
// Make sure the center point of the image is at its center, instead of the default top left
source.anchor.set( 0.5 );
// Add it to the screen
stage.addChild( source );
console.log(width/1000);
console.log(height/1000);
var vertShader = 
	`precision highp float;
	attribute vec2 aVertexPosition;
	attribute vec2 aTextureCoord;
	uniform mat3 projectionMatrix;
	varying vec2 vTextureCoord;

	void main(void){
		gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
		vTextureCoord = aTextureCoord;
	}`;

var fragShader = 
	`precision mediump float;
	varying vec2 vTextureCoord;
	uniform sampler2D uSampler;
	uniform vec4 filterArea;
	uniform vec2 dimensions;

	vec2 mapCoord( vec2 coord ) {
		coord *= filterArea.xy;
		return coord;
	}

	vec2 unmapCoord( vec2 coord ) {
		coord /= filterArea.xy;
		return coord;
	}

	// find if a point's in a triangle
	// see here: http://totologic.blogspot.fr/2014/01/accurate-point-in-triangle-test.html
	bool pointInTriangle(float x1, float y1, float x2, float y2, float x3, float y3, float x, float y) {
		float denominator = ((y2 - y3)*(x1 - x3) + (x3 - x2)*(y1 - y3));
		float a = ((y2 - y3)*(x - x3) + (x3 - x2)*(y - y3)) / denominator;
		float b = ((y3 - y1)*(x - x3) + (x1 - x3)*(y - y3)) / denominator;
		float c = 1.0 - a - b;
		
		return 0.0 <= a && a <= 1.0 && 0.0 <= b && b <= 1.0 && 0.0 <= c && c <= 1.0;
		// return true;
	}
	void main(void) {
		vec2 t1 = vec2(0.5,0.5);
		vec2 t2 = vec2(0.25,0.75);
		vec2 t3 = vec2(0.75,0.75);
		vec4 fg = texture2D(uSampler, vTextureCoord);
		vec2 coord = vTextureCoord;
		coord = mapCoord( coord ) / dimensions;
		// if ( ( coord.x >= 0.5 && coord.y >= 0.5 ) || ( coord.x < 0.5 && coord.y < 0.5 ) ) {
		// if ( ( coord.x >= 0.5 && coord.x <= 0.7 ) && ( coord.y > 0.1 && coord.y < 0.5 ) ) {
		if ( pointInTriangle(t1.x, t1.y, t2.x, t2.y, t3.x, t3.y, coord.x, coord.y)) {
			// gl_FragColor =  vec4(fg.g, fg.b, fg.r, fg.a);
			gl_FragColor =  vec4(1.0 - fg.r, 1.0 - fg.g, 1.0 - fg.b, fg.a);
		} else {
			gl_FragColor = fg;
		}
	}`;

var uniforms = {
	dimensions: { type: 'v2', value: [ width, height ] }
};

console.log(uniforms);

var simpleShader = new PIXI.Filter( null, fragShader, uniforms );
simpleShader.apply = function( filterManager, input, output ) {
	this.uniforms.dimensions[0] = input.sourceFrame.width;
	this.uniforms.dimensions[1] = input.sourceFrame.height;
	filterManager.applyFilter( this, input, output );
};

source.filters = [ simpleShader ]

function animate() {
	// start the timer for the next animation loop
	requestAnimationFrame( animate );
	// this is the main render call that makes pixi draw your container and its children.
	renderer.render( stage );
}

animate();
