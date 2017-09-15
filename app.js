'use strict';

const sslRedirect = require('heroku-ssl-redirect');
const express = require('express');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const path = require('path');
const auth = require('./middleware/auth');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const logger = require('morgan');
const config = require('./config');
const OccupiedLocation = require('./models/occupiedLocation');
const gridRoutes = require('./routes/grid.routes');
const locationsRoutes = require('./routes/locations.routes');
const userRoutes = require('./routes/user.routes');
const indexRoutes = require('./routes/index.routes');
const schedule = require('node-schedule');
const sockets = require('./services/sockets');
const LogMessage = require('./services/log-service');
require('dotenv').config();

const app = express();
// const port = process.env.PORT || 8080;
// const eventEmitter = new EventEmitter();

global.db = pgp({
	host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
	port: 5432,
	database: 'detamp7dm7n5kt',
	user: process.env.SERVICE_DB_USER || config.dbUsername,
	password: process.env.SERVICE_DB_PASS || config.dbPassword,
	ssl: true,
	sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
});

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
app.use('/api/locations', locationsRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use((err, req, res) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.send(err.message);
	// res.render('error');
});

// default last daily event time
LogMessage.getLastDailyEventDate()
	.then((data) => {
		global.lastDailyEvent = data.max;
	});


schedule.scheduleJob('0 0 3 * * *', () => {
	OccupiedLocation.recalcLocationsLifecycle()
		.then(() => {
			sockets.sendMessage('update', {
				masterName: '???',
				locationName: '???',
				dailyMessage: '???'
			});
			return new LogMessage({
				type: 'system',
				status: 'daily-event',
				msg: 'New day begins!'
			}).saveToLog();
		})
		.then(() => LogMessage.getLastDailyEventDate())
		.then((data) => {
			global.lastDailyEvent = data.max;
		})
		.catch((err) => {
			console.log(err);
		});
});

module.exports = app;
