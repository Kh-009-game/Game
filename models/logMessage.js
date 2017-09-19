const Sequelize = require('sequelize');
const sequelize = require('../services/orm-service');

const logMessage = sequelize.define('log_message', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		unique: true,
		allowNull: false,
		primaryKey: true
	},
	type: {
		type: Sequelize.STRING,
		allowNull: false,
		values: ['error', 'system']
	},
	status: {
		type: Sequelize.STRING
	},
	message: {
		type: Sequelize.TEXT
	}
});

module.exports = logMessage;
