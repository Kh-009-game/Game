const messages = require('./error-messages.json');

class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}

	static get messages() {
		return messages;
	}
}

module.exports = HttpError;
