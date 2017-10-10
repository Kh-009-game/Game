const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');

const LifeCycleEvent = sequelize.define('lifecycle', {
	updated_at: {
		type: Sequelize.DATE,
		unique: true,
		allowNull: false,
		defaultValue: Sequelize.NOW
	}
}, {
	underscored: true
});

module.exports = LifeCycleEvent;
