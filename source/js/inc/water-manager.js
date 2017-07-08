module.exports = function( uniforms ) {
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
						// c1.y += dy * 0.1;
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
