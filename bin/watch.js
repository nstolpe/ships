const chokidar = require( 'chokidar' );
const spawn = require( 'child_process' ).spawn;
const fs = require( 'fs' );

const jsPath = 'source/js/';
const imagePath = 'source/images';
const spritesheetPath = 'source/spritesheets';


const jsBuildPath = '.static/assets/js/';
const imageBuildPath = '.static/assets/images/';
const spritesheetBuildPath = '.static/assets/spritesheets/';

// watches the js files in source for changes and recompiles with browserify when they're made.
chokidar.watch( jsPath + '*.js', {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( path ) {
		const segments = path.split( '/' );
		const fileName = segments[ segments.length - 1 ];

		console.log( `recompiling \`${ jsBuildPath + fileName }\` due to changes to \`${ path }\`` );
						console.log(path);
						console.log(jsBuildPath + fileName);
		const proc = spawn( 'browserify', [ path, '-o', jsBuildPath + fileName ], {
			stdio: 'inherit'
		} );

		proc.on( 'close', code => {
			if ( code === 1) 
				console.error( `✖ "browserify ${ path } -o ${ jsBuildPath + fileName }" failed`);
			else
				console.log('watching scripts...');
		} );
	} );

chokidar.watch( jsPath + 'inc/*.js', {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( path ) {
		console.log( 'here' );
		const segments = path.split( '/' );
		const fileName = segments[ segments.length - 1 ];
		const incRx = /{INCLUDES}([\s\S]*){\/INCLUDES}/g;
		const jsRx = /([\w\-. ]+\.js)/g;

		// get the contents of the `jsPath` dir that are scripts by filtering for `.js` extension.
		// ignores directories, like `inc`
		const scripts = fs.readdirSync( jsPath ).filter( ( s ) => /\.js$/i.test( s ) );

		// loop through the javascript files
		for ( let i = 0, l = scripts.length; i < l; i++ ) {
			// contents of one of the javascript files under `jsPath`
			let fileText = fs.readFileSync( jsPath + scripts[ i ], 'utf8' );

			// match each block of INCLUDES, there should really be only one
			while ( includeMatch = incRx.exec( fileText ) ) {
				let includeText = includeMatch[ 1 ];

				// match each included js file from `inc/`
				while ( jsMatch = jsRx.exec( includeText ) ) {

					// if `fileName` is one of the includes, compile
					if ( jsMatch[ 1 ] === fileName ) {
						console.log(jsPath + scripts[ i ]);
						console.log(jsBuildPath + scripts[ i ]);
						let proc = spawn( 'browserify', [ jsPath + scripts[ i ], '-o', jsBuildPath + scripts[ i ] ], {
							stdio: 'inherit'
						} );


						console.log( `recompiling \`${ jsBuildPath + scripts[ i ] }\` due to changes to \`${ path }\`` );

						proc.on( 'close', code => {
							if ( code === 1) 
								console.error( `✖ "browserify ${ path } -o ${ jsBuildPath + fileName }" failed`);
							else
								console.log('Watching srcipts...');
						} );

						// no need to keep looking after one has been matched, recompiling the top level will 
						// pull in changes of included files
						break;
					}
				}
			}
		}
	} );

// watches source/images for changes and copies them to imageBuildPath
chokidar.watch( imagePath, {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( path ) {
		const proc = spawn( 'cp', [ path, imageBuildPath ], {
			stdio: 'inherit'
		} );

		proc.on( 'close', code => {
			if ( code === 1)
				console.error( `✖ "failed"`);
			else
				console.log(`Copied ${path} to ${imageBuildPath}`);
				console.log('Watching images...');
		} );
	} );

chokidar.watch( spritesheetPath, {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( path ) {
		const proc = spawn( 'cp', [ path, spritesheetBuildPath ], {
			stdio: 'inherit'
		} );

		proc.on( 'close', code => {
			if ( code === 1)
				console.error( `✖ "failed"`);
			else
				console.log(`Copied ${path} to ${spritesheetBuildPath}`);
				console.log('Watching spritesheets...');
		} );
	} );

console.log( 'Watching...' );
