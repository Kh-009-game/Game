const io = require('socket.io');
const OccupiedLocation = require('../models/occupiedLocation');

class Sockets {
	init(server) {
		this.io = this.io || io.listen(server);
		this.io.sockets.on('connection', (socket) => {
			console.log('user connected');
			socket.on('disconnect', () => {
				console.log('user disconnected');
			});
			socket.on('editLocationWS', (data) => {
				OccupiedLocation.getLocationById(data.locationId)
					.then((location) => {
						Object.assign(location, data);
						location.editLocation();
						this.io.sockets.emit('update', {
							type: 'EditLoc',
							text: `The location with id ${data.locationId} was renamed`
						});
					})
					.catch((err) => {
						console.log('error', err);
					});
			});
		});
	}

	sendMessage(message, data) {
		this.io.sockets.emit(message, data);
	}
}
module.exports = new Sockets();

