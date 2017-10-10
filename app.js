'use strict';

require('dotenv').config();

const sslRedirect = require('heroku-ssl-redirect');
const express = require('express');
const bodyParser = require('body-parser');
// const pgp = require('pg-promise')();
const path = require('path');
const auth = require('./middleware/auth');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const logger = require('morgan');
const gridRoutes = require('./routes/grid.routes');
const boundsRoutes = require('./routes/bounds.routes');
const locationsRoutes = require('./routes/locations.routes');
const userRoutes = require('./routes/user.routes');
const indexRoutes = require('./routes/index.routes');
const underpassesRoutes = require('./routes/underpasses.routes');
const logService = require('./services/log-service');

const app = express();
// const port = process.env.PORT || 8080;
// const eventEmitter = new EventEmitter();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middlewares
app.use(sslRedirect());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('assets'));
app.use(favicon('./assets/favicon.png'));

app.use('/user', userRoutes);
app.use('/', auth);
app.all('/', indexRoutes);
app.use('/api/grid', gridRoutes);
app.use('/api/bounds', boundsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/underpasses', underpassesRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	console.dir(err);
	logService.error({
		status: err.status,
		msg: err.message
	});
	res.status(err.status || 500);
	res.send(err.message);
});


module.exports = app;
