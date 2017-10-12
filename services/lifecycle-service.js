const schedule = require('node-schedule');
const LifeCycleEvent = require('../models/lifecycle-event');
const ClientLocationObject = require('./location-service');
const Locker = require('./locker-service');
const eventEmitter = require('./eventEmitter-service');
const HttpError = require('./utils/http-error');

const lifecycleLocker = new Locker(new HttpError(403, HttpError.messages.isLifecycle));

function emitLifecycle() {
	eventEmitter.emit('lifecycle-started');
	return new Promise((res) => {
		lifecycleLocker.lock();
		res();
	})
		.then(() => ClientLocationObject.recalcLocationsLifecycle())
		.then(() => {
			lifecycleLocker.unlock();
			eventEmitter.emit('daily-event');
			console.log('Daily event!');
		});
}

function setLifecycleEvent(str) {
	str = str || '0 0 3 * * *';

	schedule.scheduleJob(str, () => {
		emitLifecycle()
			.catch((err) => {
				emitLifecycle();
				console.log('Daily event trouble:');
				console.dir(err);
			});
	});
}

function checkLifecycleInDB() {
	LifeCycleEvent.createIfNone()
		.then(() => {
			console.log('OK!');
		})
		.catch((err) => {
			console.log(err);
			checkLifecycleInDB();
		});
}

checkLifecycleInDB();
setLifecycleEvent();

module.exports.emitLifecycle = emitLifecycle;
module.exports.checkDBRecalc = () => lifecycleLocker.check();
