const LogMessage = require('../models/logMessage');

class LogService {
	static log(msg) {
		return LogMessage.create({
			type: msg.type,
			status: msg.status,
			message: msg.message
		});
	}

	static error(errorProps) {
		return LogService.log({
			type: 'error',
			status: errorProps.status,
			message: errorProps.message
		});
	}

	static system(msgProps) {
		return LogService.log({
			type: 'system',
			status: msgProps.status,
			message: msgProps.message
		});
	}

	static getLastLifeCycleEventDate() {
		return LogMessage.max('created_at', {
			where: {
				type: 'system',
				status: 'daily-event'
			}
		});
	}
}

module.exports = LogService;
module.exports.LogMessage = LogMessage;
