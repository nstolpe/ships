const PIXI = require( 'pixi.js' );

console.log('shader');

// Get the screen width and height
var width = 792;
var height = 792;
// var width = window.innerWidth;
// var height = window.innerHeight;
var view = document.getElementById( 'view' );
var app = new PIXI.Application( width, height, { view: view, backgroundColor : 0x110000 } );
// var source = PIXI.Sprite.fromImage( "assets/images/boxes-blue-red.png" );
var source = PIXI.extras.TilingSprite.fromImage(
	// "assets/images/tile-1px-black.png",
	"assets/images/sand.png",
	width,
	height
);
// var source = PIXI.Sprite.fromImage( "assets/images/sand-brown.png" );
// Set it at the center of the screen
source.x = width / 2;
source.y = height / 2;
// Make sure the center point of the image is at its center, instead of the default top left
source.anchor.set( 0.5 );
// Add it to the screen
app.stage.addChild( source );

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

function WaterManager( uniforms ) {
	return {
		init() {
			this.uniforms.uTime = { type: 'f', value: 0 }
			this.shader.shader = new PIXI.Filter( this.shader.vertex, this.shader.fragment, this.uniforms );
			// this.shader.shader.autoFit = false;
			this.shader.shader.apply = function( filterManager, input, output ) {
				this.uniforms.uResolution[0] = input.sourceFrame.width * 0.5;
				this.uniforms.uResolution[1] = input.sourceFrame.height * 0.5;
				filterManager.applyFilter( this, input, output );
			};
			return this;
		},
		uniforms: uniforms,
		update( delta ) {
			// this.uniforms.time.value = delta;
			if ( this.uniforms.uTime.value > 400000 )
				this.uniforms.uTime.value = 0;

			this.uniforms.uTime.value += delta;
			this.shader.shader.uniforms.uTime = this.uniforms.uTime.value;
		},
		shader: {
			vertex:
				`//precision highp float;
				attribute vec2 aVertexPosition;
				attribute vec2 aTextureCoord;
				uniform mat3   projectionMatrix;
				uniform mat3   filterMatrix;
				varying vec2   vTextureCoord;
				varying vec2   vFilterCoord;

				void main(void){
					gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
					vFilterCoord = ( filterMatrix * vec3( aTextureCoord, 1.0) ).xy;
					vTextureCoord = aTextureCoord;
				}`,
			fragment:
				// `// lava
				// // https://www.shadertoy.com/view/ldXGz7
				// precision mediump float;
				// varying vec2 vTextureCoord;
				// varying vec2 vFilterCoord;
				// uniform sampler2D uSampler;
				// uniform sampler2D filterSampler;
				// uniform vec4 filterArea;
				// uniform float uTime;
				// void main(void) {
				// 	float fragTime = uTime * 0.02;
				// 	vec2 uv = vTextureCoord;
				// 	uv.y += (cos((uv.y + (fragTime * 0.04)) * 45.0) * 0.0019) +
				// 		(cos((uv.y + (fragTime * 0.1)) * 10.0) * 0.002);
				// 	uv.x += (sin((uv.y + (fragTime * 0.07)) * 15.0) * 0.0029) +
				// 		(sin((uv.y + (fragTime * 0.1)) * 15.0) * 0.002);
				// 	gl_FragColor = texture2D(uSampler, uv);
				// }`,
				`// water
				// https://www.shadertoy.com/view/4slGRM
				varying vec2 vTextureCoord;
				varying vec2 vFilterCoord;
				uniform sampler2D uSampler;
				uniform sampler2D filterSampler;
				uniform vec4 filterArea;
				uniform float uTime;
				uniform vec2 uDimensions;
				const float PI = 3.1415926535897932;

				// play with these parameters to custimize the effect
				// ===================================================

				//speed
				const float speed = 0.004;
				const float speed_x = 0.002;
				const float speed_y = 0.002;

				// refraction
				const float emboss = 0.50;
				const float intensity = .8;
				const int steps = 8;
				const float frequency = 80.0;
				const int angle = 13; // better when a prime

				// reflection
				const float delta = 60.;
				const float intence = 1300.;

				const float reflectionCutOff = 0.012;
				const float reflectionIntence = 200000.;

				// ===================================================


				float col( vec2 coord, float time ) {
					float delta_theta = 2.0 * PI / float( angle );
					float col = 0.0;
					float theta = 0.0;

					for (int i = 0; i < steps; i++) {
						vec2 adjc = coord;
						theta = delta_theta * float( i );
						adjc.x += cos( theta ) * time * speed + time * speed_x;
						adjc.y -= sin( theta ) * time * speed - time * speed_y;
						col = col + cos( (adjc.x * cos( theta ) - adjc.y * sin( theta ) ) * frequency ) * intensity;
					}

					return cos( col );
				}

				//---------- main

				void main( void ) {
						float time = uTime * 0.2 * 1.3;

						vec2 p = vTextureCoord, c1 = p, c2 = p;
						float cc1 = col( c1, time );

						c2.x += filterArea.x / delta;
						// c2.x += uDimensions.x / delta;
						float dx = emboss * ( cc1 - col( c2, time ) ) / delta;

						c2.x = p.x;
						c2.y += filterArea.y / delta;
						// c2.y += uDimensions.y / delta;
						float dy = emboss * ( cc1-col( c2, time ) ) / delta;

						c1.x += dx * 0.1;
						c1.y = (c1.y + dy * 0.1 );

						float alpha = 1.0 + dot( dx, dy ) * intence;

						float ddx = dx - reflectionCutOff;
						float ddy = dy - reflectionCutOff;
						if ( ddx > 0. && ddy > 0.0 )
							alpha = pow( alpha, ddx * ddy * reflectionIntence );
							
						// gl_FragColor = texture2D( uSampler, c1 ) * ( alpha );
						vec4 texColor = texture2D( uSampler, c1 );
						texColor.r = max( texColor.r * 0.5, 0.0 );
						texColor.g = max( texColor.g * 0.5, 0.0 );
						texColor.b = max( texColor.b * 0.5, 0.0 );
						gl_FragColor = texColor * alpha;
				}`,
			shader: undefined
		}
	}
}

function ColorManager( uniforms ) {
		return {
			targetColor: [ Math.random(), Math.random(), Math.random() ],
			originColor: uniforms.color.value.slice(),
			currentColor: uniforms.color.value,
			elapsed: 0,
			uniforms: uniforms,
			init() {
				this.shader.shader = new PIXI.Filter( this.shader.vertex, this.shader.fragment, this.uniforms );
				this.shader.shader.apply = function( filterManager, input, output ) {
					this.uniforms.dimensions[0] = input.sourceFrame.width;
					this.uniforms.dimensions[1] = input.sourceFrame.height;
					filterManager.applyFilter( this, input, output );
				};
				return this;
			},
			update( delta ) {
				this.elapsed += delta;

				for ( let idx = 3; idx > 0; idx-- )
					this.updateColorComponent( delta, idx - 1 );

				if ( this.targetReached() ) this.reset();
			},
			updateColorComponent( delta, idx ) {
					let origin = this.originColor[ idx ];
					let target = this.targetColor[ idx ];
					let current = this.currentColor[ idx ];
					current = this.lerp( origin, target, 1 * this.elapsed / 100 );

					// if it's close enough, mo
					if ( Math.abs( current - target ) < .001 ) current = target;

					this.originColor[ idx ] = origin;
					this.targetColor[ idx ] = target;
					this.currentColor[ idx ] = current;
			},
			targetReached() {
				for ( let idx = 3; idx > 0; idx-- )
					if ( this.currentColor[ idx ] !== this.targetColor[ idx ] ) return false;

				return true;
			},
			reset() {
				this.originColor = this.targetColor.slice();
				this.targetColor = [ Math.random(), Math.random(), Math.random() ];
				this.elapsed = 0;
			},
			lerp( origin, target, amount = 0.2 ) {
				return ( 1 - amount ) * origin + amount * target;
			},
			shader: {
				vertex: 
					`precision highp float;
					attribute vec2 aVertexPosition;
					attribute vec2 aTextureCoord;
					uniform mat3 projectionMatrix;
					varying vec2 vTextureCoord;

					void main(void){
						gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
						vTextureCoord = aTextureCoord;
					}`,
				fragment:
					`precision mediump float;
					varying vec2 vTextureCoord;
					uniform sampler2D uSampler;
					uniform vec4 filterArea;
					uniform vec2 dimensions;
					uniform vec3 color;

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

						if ( pointInTriangle(t1.x, t1.y, t2.x, t2.y, t3.x, t3.y, coord.x, coord.y)) {
							// gl_FragColor =  vec4(fg.g, fg.b, fg.r, fg.a);
							// gl_FragColor =  vec4(1.0 - fg.r, 1.0 - fg.g, 1.0 - fg.b, fg.a);
							gl_FragColor =  vec4(color, fg.a);
						} else {
							gl_FragColor = fg;
						}
					}`,
				shader: undefined
			},
		}
	}

// let colorManager = ColorManager( {
// 	dimensions: { type: 'v2', value: [ width, height ] },
// 	color: { type: 'v3', value: [ 1, 1, 1 ] }
// } ).init();

let waterManager = WaterManager( {
	uResolution: { type: 'v2', value: [ width, height ] },
} ).init();

source.filters = [ waterManager.shader.shader ];
// source.filters = [ colorManager.shader.shader ];

function animate( delta ) {
	waterManager.update( delta );
	// colorManager.update( delta );
}
window.f = new PIXI.Filter();

app.ticker.add( animate );

const timeInput = document.getElementById( 'time' );
const timeButton = document.getElementById( 'time-button' );
const timeForm = document.getElementById( 'time-form' );

timeInput.addEventListener( 'blur', function( e ) {
	if ( !this.value && this.value !== 0 )
		this.value = 0.0;
} );

timeForm.addEventListener( 'submit', function( e ) {
	e.preventDefault();
	
	if ( timeInput.value === undefined )
		timeInput.value = 0.0;

	waterManager.uniforms.uTime.value = parseFloat( timeInput.value );


}, false );
