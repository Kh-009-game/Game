const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');

const logMessage = sequelize.define('log_message', {
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
}, {
	underscored: true
});

module.exports = logMessage;
