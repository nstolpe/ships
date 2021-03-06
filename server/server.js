'use strict'

const express = require( 'express' );
const app = express();
const http = require( 'http' ).Server( app );
const exphbs = require( 'express-handlebars' );
const port = 2400;
const fs = require( 'fs' );

//for when static assets are used, if they are
app.use( express.static( '../.static' ) );

app.engine( '.hbs', exphbs( {
	extname: '.hbs',
	defaultLayout: false
} ) );

app.set( 'view engine', '.hbs' );

app.get( '/*', function( req, res ) {
	let template = req.params[0] || 'index';
	let data = {}

	if ( template === 'index' ) {
		data.pages = [];
		fs.readdirSync( './views' ).forEach( file => {
			if ( file !== 'index.hbs' ) {
				data.pages.push( file.replace( '.hbs', '' ) );
			}
		} );
	}

	try {
		res.render(
			template,
			{
				data: data, config: 'config'
			},
			function( err, html ) {
				if ( err ) {
					console.log(err.code); 
					res.status( 404 ).send(
						`<style>
							* { margin: 0; }
							.message {
								position: relative;
								top: 50%;
								transform: translateY(-50%);
								text-align: center;
							}
						</style>
						<div id="message" class="message">
							<h3>404</h3>
							<p><em>/${ req.params[0] }</em> does not exist</p>
						</div>
						`
					);
				} else {
					res.send( html );
				}
			}
		);
	} catch( e ) {
		// mostly catches missing template errors (MODULE_NOT_FOUND).
		res.status( 500 ).send(
			`<style>
				* { margin: 0; }
				.message {
					position: relative;
					top: 50%;
					transform: translateY(-50%);
					text-align: center;
				}
			</style>
			<div id="message" class="message">
				<h3>500</h3>
				<p><em>/${ req.params[0] }</em> might exist, or it might not. Something went wrong somewhere.</p>
			</div>
			`
		);
	}
} );

// app.get('/', function(req, res) {
// 	console.log('slash');
// 	res.render('index', { data: 'data', config: 'config' });
// });

// app.get('/gravity', function(req, res) {
// 	res.render('gravity', { data: 'data', config: 'config' });
// });

// app.get('/current', function(req, res) {
// 	console.log('current');
// 	res.render('current', { data: 'data', config: 'config' });
// });

// app.get('/current', function(req, res) {
// 	res.render('current', { data: 'data', config: 'config' });
// });

http.listen( port, function() {
	console.log( 'listening on port %s', port );
} );
