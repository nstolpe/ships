'use strict'

const express = require('express');
const app = express();
const http = require('http').Server(app);
const exphbs = require('express-handlebars');
const port = 2400;

//for when static assets are used, if they are
app.use(express.static('static'));

app.engine('.hbs', exphbs({
	extname: '.hbs',
	defaultLayout: false
}));

app.set('view engine', '.hbs');

app.get('/', function(req, res) {
	res.render('index', { data: 'data', config: 'config' });
});

app.get('/gravity', function(req, res) {
	res.render('gravity', { data: 'data', config: 'config' });
});

http.listen(port, function() {
	console.log('listening on port %s', port);
});
