const eventEmitter = require('./eventEmitter-service');
const ClientLocationObject = require('../services/location-service');

module.exports = function (io) {
	io.on('connection', (socket) => {
		socket.on('editLocationWS', (data) => {
			console.log('SOCKET_data', data);
			ClientLocationObject.updateLocation(data.locationId, data)
				.catch((err) => {
					console.log('error', err);
				});
			socket.emit('update', {
				type: 'msgUpdateLoc',
				text: `
			Location ${data.locationId} was updated.
			`
			});
		});

		eventEmitter.on('location-created', (newLocationData) => {
			socket.emit('update', {
				type: 'msgCreateLoc',
				text: `
			The new location was occupied on latitude: ${newLocationData.lat} 
			and longitude: ${newLocationData.lng}.
		`
			});
		});

		eventEmitter.on('location-updated', (locationData) => {
			socket.emit('update', {
				type: 'msgUpdateLoc',
				text: `
			Location ${locationData.locationId} was updated.
		`
			});
		});

		eventEmitter.on('location-deleted', (locationData) => {
			socket.emit('update', {
				type: 'msgDeleteLoc',
				text: `
			Location ${locationData.locationId} was deleted.
		`
			});
		});

		eventEmitter.on('daily-event', () => {
			socket.emit('update', {
				type: 'msgCreateLoc',
				text: `
			New day begins!
		`
			});
		});
	});
};
