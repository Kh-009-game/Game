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
				console.log('SSSSSoket', data);
				const promise = new Promise((resolve, reject) => {
					const location = OccupiedLocation.getLocationById(data.locationId);
					resolve(location);
				});
				promise.then((location) => {
					console.log('IIIIIIIIIIIIII', location);
					console.log('EEEE', data);
					location.editLocationWS(data);
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

	// getMessageWS(message, data){
	// 	this.io.sockets.on('connection', (socket) => {
	// 		socket.on(message, (data) => {
	// 			console.log('SsssssssSSoket', data);				
	// 			global.db.any(
	// 				`update locations2
	// 				 set loc_name = '${data.locationName}',
	// 							daily_msg = '${data.dailyMessage}'
	// 				 where loc_id = ${data.locationId}`
	// 			);
	// 		});
	// 	});
	// }	
}
module.exports = new Sockets();

