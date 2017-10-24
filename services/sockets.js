const eventEmitter = require('./eventEmitter-service');
const ClientLocationObject = require('../services/location-service');

module.exports = function (io) {
	io.sockets.on('connection', (socket) => {
		socket.on('editLocationWS', (data) => {
			ClientLocationObject.updateLocation(data.locationId, data)	
				.then(() => {					
					io.socket.emit('update', {
						type: 'msgUpdateLoc',
						text: `
					Location ${data.locationId} was updated.
					`
					})				
				})
				.catch((err) => {
					const message = err.errors[0];
					socket.emit('my_error', {
						type: 'updateEr',
						text: message.message
					});
				})
		});
	});

	eventEmitter.on('location-created', (newLocationData) => {
		io.sockets.emit('update', {
			type: 'msgCreateLoc',
			text: `
				The new location was occupied on latitude: ${newLocationData.lat} 
				and longitude: ${newLocationData.lng}.
			`
		});
	});

	eventEmitter.on('lifecycle-started', () => {
		io.sockets.emit('lifecycle-started');
	});

	eventEmitter.on('location-updated', (locationData) => {
		io.sockets.emit('update', {
			type: 'msgUpdateLoc',
			text: `
				Location ${locationData.locationId} was updated.
			`
		});
	});

	eventEmitter.on('location-deleted', (locationData) => {
		io.sockets.emit('update', {
			type: 'msgDeleteLoc',
			text: `
				Location ${locationData.locationId} was deleted.
			`
		});
	});

	eventEmitter.on('underpass-created', () => {
		io.sockets.emit('underpass-update', {
			type: 'msgUpdate',
			text: 'Underpass has been created.'
		});
	});

	eventEmitter.on('daily-event', () => {
		io.sockets.emit('daily-event');
		io.sockets.emit('update', {
			type: 'msgCreateLoc',
			text: `
				New day begins!
			`
		});
	});
};
