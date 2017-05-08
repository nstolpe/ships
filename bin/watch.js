const chokidar = require( 'chokidar' );
const spawn = require( 'child_process' ).spawn;
const fs = require( 'fs' );

const jsPath = 'source/static/js/';
const buildPath = 'source/server/.static/assets/js/';
const imagePath = 'source/server/.static/assets/images/';

// watches the js files in source/static for changes and recompiles with browserify when they're made.
chokidar.watch( jsPath + '*.js', {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( path ) {
		const segments = path.split( '/' );
		const fileName = segments[ segments.length - 1 ];

		console.log( 'hi' );

		const proc = spawn( 'browserify', [ path, '-o', buildPath + fileName ], {
			stdio: 'inherit'
		} );

		proc.on( 'close', code => {
			if ( code === 1) 
				console.error( `✖ "browserify ${ path } -o ${ buildPath + fileName }" failed`);
			else
				console.log('watching...');
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

		// loop through the javascript files, cache each as fileName
		for ( let i = 0, l = scripts.length; i < l; i++ ) {
			// contents of one of the javascript files under `jsPath`
			let fileText = fs.readFileSync( jsPath + scripts[ i ], 'utf8' );

			// match each block of INCLUDES
			while ( includeMatch = incRx.exec( fileText ) ) {
				let includeText = includeMatch[ 1 ];

				while ( jsMatch = jsRx.exec( includeText ) ) {

					if ( jsMatch[ 1 ] === fileName ) {
						let proc = spawn( 'browserify', [ path, '-o', jsPath + fileName ], {
							stdio: 'inherit'
						} );

						console.log( `recompiling \`${ buildPath + scripts[ i ] }\` due to changes to \`${ path }\`` );

						proc.on( 'close', code => {
							if ( code === 1) 
								console.error( `✖ "browserify ${ path } -o ${ buildPath + fileName }" failed`);
							else
								console.log('watching...');
						} );
					}
				}
			}
		}
	} );

// watches source/static/images for changes and copies them to imagePath
chokidar.watch( 'source/static/images', {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( path ) {
		const proc = spawn( 'cp', [ path, imagePath ], {
			stdio: 'inherit'
		} );

		proc.on( 'close', code => {
			if ( code === 1) 
				console.error( `✖ "failed"`);
			else
				console.log('watching image...');
		} );
	} );

console.log( 'watching...' );
