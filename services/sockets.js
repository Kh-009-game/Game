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
		});
	}

	sendMessage(message, data) {
		this.io.sockets.emit(message, data);
	}
}
module.exports = new Sockets();

