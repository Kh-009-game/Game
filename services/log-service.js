const db = require('../services/db-transport');

class LogMessage {
	constructor(options) {
		this.time = new Date();
		this.type = options.type;
		this.status = options.status;
		this.msg = options.msg;
	}

	saveToLog() {
		return db.none(`
      insert into log_messages (
        time, type, status, msg
      )
      values(
        '${this.time.toISOString()}',
        '${this.type}',
        '${this.status}',
        '${this.msg}'
      )
    `);
	}

	static findLastTimeOf(msgProps) {
		return db.one(`
      select max(time) from log_messages
      where status = '${msgProps.status}' 
      and type = '${msgProps.type}';
    `);
	}

	static clearLog() {
		return db.none(`
      delete from log_messages;
    `);
	}
}

function log(msg) {
	const logMsg = new LogMessage({
		type: msg.type,
		status: msg.status,
		msg: msg.msg
	});

	return logMsg.saveToLog();
}

function error(errorProps) {
	return log({
		type: 'error',
		status: errorProps.status,
		msg: errorProps.msg
	});
}

function system(msgProps) {
	return log({
		type: 'system',
		status: msgProps.status,
		msg: msgProps.msg
	});
}

function getLastTimeOfMsg(msgProps) {
	return LogMessage.findLastTimeOf({
		type: msgProps.type,
		status: msgProps.status
	});
}

function getLastDailyEventTime() {
	return getLastTimeOfMsg({
		type: 'system',
		status: 'daily-event'
	});
}

const logStorage = {};

getLastDailyEventTime()
	.then((data) => {
		logStorage.lastDailyEventTime = data.max;
	});

module.exports.log = log;
module.exports.error = error;
module.exports.system = system;
module.exports.getLastDailyEventTime = getLastDailyEventTime;
module.exports.logStorage = logStorage;
