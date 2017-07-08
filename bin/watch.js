const chokidar = require( 'chokidar' );
const spawn = require( 'child_process' ).spawn;
const fs = require( 'fs' );

const jsPath = 'source/js/';
const imagePath = 'source/images';
const spritesheetPath = 'source/spritesheets';


const jsBuildPath = '.static/assets/js/';
const imageBuildPath = '.static/assets/images/';
const spritesheetBuildPath = '.static/assets/spritesheets/';

/**
 * watches the js files in source for changes and recompiles with browserify when they're made.
 */
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
/**
 * Watches all files in the include directory (default: `source/js/inc`) for changes.
 * On change, parses through all files in `jsPath` directory (default: `source/js`), matches
 * calls to `require()`, looks for the file name inside them, and recompiles the files under `jsPath`.
 */
chokidar.watch( jsPath + 'inc/*.js', {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( path ) {
		const segments = path.split( '/' );
		const fileName = segments[ segments.length - 1 ];
		const incRx = /{INCLUDES}([\s\S]*){\/INCLUDES}/g;
		const jsRx = /([\w\-. ]+\.js)/g;
		// matches require statements
		const reqRx = /require\(\s*?'([\w\-. \/]*\.js)'\s*?\)/g;

		// get the contents of the `jsPath` dir that are scripts by filtering for `.js` extension.
		// ignores directories, like `inc`
		const scripts = fs.readdirSync( jsPath ).filter( ( s ) => /\.js$/i.test( s ) );

		// loop through the javascript files
		for ( let i = 0, l = scripts.length; i < l; i++ ) {
			// contents of one of the javascript files under `jsPath`
			let fileText = fs.readFileSync( jsPath + scripts[ i ], 'utf8' );
			
			// match each `require( '...' )` statement
			// but first this, otherwise the exec doesn't get all matches? @TODO Fix. Text matches in Node CLI and Chrome browser console.
			fileText.match( reqRx );
			while ( reqMatch = reqRx.exec( fileText ) ) {
				// console.log(reqMatch[ 1 ].substring( reqMatch[ 1 ].length - fileName.length ));
				if ( fileName === reqMatch[ 1 ].substring( reqMatch[ 1 ].length - fileName.length ) ) {
					let proc = spawn( 'browserify', [ jsPath + scripts[ i ], '-o', jsBuildPath + scripts[ i ] ], {
						stdio: 'inherit'
					} );

					console.log( `recompiling \`${ jsBuildPath + scripts[ i ] }\` due to changes to \`${ path }\`` );

					proc.on( 'close', code => {
						if ( code === 1 ) 
							console.error( `✖ "browserify ${ path } -o ${ jsBuildPath + fileName }" failed` );
						else
							console.log( 'Watching scripts...' );
					} );

					// no need to keep looking after one has been matched, recompiling the top level will 
					// pull in changes of included files
					break;
				}
			}
		}
	} );

/**
 * watches source/images for changes and copies them to imageBuildPath
 */
chokidar.watch( imagePath, {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( path ) {
		console.log( path );
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
/**
 * Watches the `spriteSheetPath` (default: 'source/spritesheets') for changes
 */
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
