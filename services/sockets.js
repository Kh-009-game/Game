const eventEmitter = require('./eventEmitter-service');

let ws;

module.exports = function (io) {
	io.on('connection', (socket) => {
		ws = socket;
		socket.on('message', (message) => {
			console.log('info', message.value);
			socket.emit('ditConsumer', message.value);
			console.log('from console', message.value);
		});
	});
};

eventEmitter.on('location-created', (newLocationData) => {
	sendNotification('update', {
		type: 'msgCreateLoc',
		text: `
			The new location was occupied on latitude: ${newLocationData.lat} 
			and longitude: ${newLocationData.lng}.
		`
	});
});

eventEmitter.on('location-updated', (locationData) => {
	sendNotification('update', {
		type: 'msgUpdateLoc',
		text: `
			Location ${locationData.locationId} was updated.
		`
	});
});

eventEmitter.on('location-deleted', (locationData) => {
	sendNotification('update', {
		type: 'msgDeleteLoc',
		text: `
			Location ${locationData.locationId} was deleted.
		`
	});
});

eventEmitter.on('daily-event', () => {
	sendNotification('update', {
		type: 'msgCreateLoc',
		text: `
			New day begins!
		`
	});
});

function sendNotification(message, data) {
	ws.emit(message, data);
}

