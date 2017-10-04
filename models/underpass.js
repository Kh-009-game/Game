const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');

const Underpass = sequelize.define('underpass', {
	distance: {
		type: Sequelize.DECIMAL,
		allowNull: false,
		validate: {
			max: 5
		}
	}
}, {
	underscored: true
});

module.exports = Underpass;
