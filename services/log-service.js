class LogMessage {
	constructor(options) {
		this.time = new Date();
		this.type = options.type;
		this.status = options.status;
		this.msg = options.msg;
	}

	saveToLog() {
		return global.db.none(`
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

	static getLastDailyEventDate() {
		return global.db.one(`
      select max(time) from log_messages
      where status = 'daily-event';
    `);
	}

	clearLog() {
		return global.db.none(`
      delete from log_messages;
    `);
	}
}

module.exports = LogMessage;
