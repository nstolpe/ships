const chokidar = require( 'chokidar' );
const browserify = require('browserify')
const spawn = require( 'child_process' ).spawn;
const fs = require( 'fs' );
const path = require( 'path' );

const jsPath = 'source/js/';
const dataPath = 'source/data/';
const imagePath = 'source/images';
const spritesheetPath = 'source/spritesheets';


const jsBuildPath = '.static/assets/js/';
const dataBuildPath = '.static/assets/data/';
const imageBuildPath = '.static/assets/images/';
const spritesheetBuildPath = '.static/assets/spritesheets/';

/**
 * watches the js files in source for changes and recompiles with browserify when they're made.
 */
chokidar.watch( jsPath + '*.js', {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( filePath ) {
		const segments = filePath.split( '/' );
		const fileName = segments[ segments.length - 1 ];

		console.log( `recompiling \`${ jsBuildPath + fileName }\` due to changes to \`${ filePath }\`` );
		const proc = spawn(
			'browserify',
			[
				filePath,
				'-o',
				jsBuildPath + fileName,
				`--noparse=${ path.join( __dirname, '..' ) }/node_modules/pixi-particles/dist/pixi-particles.min.js`
			],
			{
				stdio: 'inherit'
			}
		);
		proc.on( 'close', code => {
			if ( code === 1)
				console.error( `✖ "browserify ${ filePath } -o ${ jsBuildPath + fileName }" failed`);
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
	.on( 'change', function( filePath ) {
		const segments = filePath.split( '/' );
		const fileName = segments[ segments.length - 1 ];
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

					console.log( `recompiling \`${ jsBuildPath + scripts[ i ] }\` due to changes to \`${ filePath }\`` );

					proc.on( 'close', code => {
						if ( code === 1 ) 
							console.error( `✖ "browserify ${ filePath } -o ${ jsBuildPath + fileName }" failed` );
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
	.on( 'change', function( filePath ) {
		console.log( filePath );
		let subPath = filePath.replace( imagePath, '' );
		console.log( imageBuildPath + subPath  );
		const proc = spawn( 'cp', [ filePath, imageBuildPath + subPath ], {
			stdio: 'inherit'
		} );

		proc.on( 'close', code => {
			if ( code === 1)
				console.error( `✖ "failed"`);
			else
				console.log(`Copied ${filePath} to ${imageBuildPath}`);
				console.log('Watching images...');
		} );
	} );
/**
 * Watches the `spriteSheetPath` (default: 'source/spritesheets') for changes
 */
chokidar.watch( spritesheetPath, {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( filePath ) {
		const proc = spawn( 'cp', [ filePath, spritesheetBuildPath ], {
			stdio: 'inherit'
		} );

		proc.on( 'close', code => {
			if ( code === 1)
				console.error( `✖ "failed"`);
			else
				console.log(`Copied ${ filePath } to ${ spritesheetBuildPath }`);
				console.log('Watching spritesheets...');
		} );
	} );
/**
 * Watches the `dataPath` (default: 'source/data') for changes
 */
chokidar.watch( dataPath, {
		ignored: /(^|[\/\\])\../
	} )
	.on( 'change', function( filePath ) {
		const proc = spawn( 'cp', [ filePath, dataBuildPath ], {
			stdio: 'inherit'
		} );

		proc.on( 'close', code => {
			if ( code === 1)
				console.error( `✖ "failed"`);
			else
				console.log(`Copied ${ filePath } to ${ dataBuildPath }`);
				console.log('Watching data...');
		} );
	} );

console.log( 'Watching...' );
