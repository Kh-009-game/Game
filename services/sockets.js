const io = require('socket.io');

class Sockets {
	constructor() {
		// this.activeSocketService = 'Hello';
	}

	init(server) {
		this.io = this.io || io.listen(server);
		this.io.sockets.on('connection', (socket) => {
			console.log('user connected');
			socket.on('disconnect', () => {
				console.log('user disconnected');
			});
			socket.on('updateLocationWS', (data) => {
				console.log('SSSSSoket', data);				
				global.db.any(
					`update locations2
					set loc_name = '${data.locationName}',
					daily_msg = '${data.dailyMessage}'
					where loc_id = ${data.locationId}`
				);
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

