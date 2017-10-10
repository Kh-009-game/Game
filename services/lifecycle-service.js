const schedule = require('node-schedule');
const LifeCycleEvent = require('../models/lifecycle-event');
const ClientLocationObject = require('./location-service');
const eventEmitter = require('./eventEmitter-service');


function emitLifecycle() {
	return LifeCycleEvent.updateByTransLifecycleAndReturn()
		.then(lifeCycleEvent => ClientLocationObject.recalcLocationsLifecycle(lifeCycleEvent))
		.then(() => {
			eventEmitter.emit('daily-event');
			console.log('Daily event!');
		});
}

function setLifecycleEvent(str) {
	str = str || '0 0 3 * * *';

	schedule.scheduleJob(str, () => {
		emitLifecycle()
			.catch((err) => {
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