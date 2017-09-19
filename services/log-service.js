const LogMessage = require('../models/logMessage');

function log(msg) {
	return LogMessage.create({
		type: msg.type,
		status: msg.status,
		message: msg.message
	});
}

function error(errorProps) {
	return log({
		type: 'error',
		status: errorProps.status,
		message: errorProps.message
	});
}

function system(msgProps) {
	return log({
		type: 'system',
		status: msgProps.status,
		message: msgProps.message
	});
}

module.exports.log = log;
module.exports.error = error;
module.exports.system = system;
