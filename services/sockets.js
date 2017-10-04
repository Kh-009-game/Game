const eventEmitter = require('./eventEmitter-service');

let ws;

module.exports = function (io) {
	io.on('connection', (socket) => {
		ws = socket;
		socket.on('editLocationWS', (data) => {
			// OccupiedLocation.getLocationById(data.locationId)
			// 	.then((location) => {
			// 		Object.assign(location, data);
			// 		location.editLocation();
			// 		this.io.sockets.emit('update', {
			// 			type: 'EditLoc',
			// 			text: `The location with id ${data.locationId} was renamed`
			// 		});
			// 	})
			// 	.catch((err) => {
			// 		console.log('error', err);
			// 	});
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

