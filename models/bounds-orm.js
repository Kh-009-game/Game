const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');

const Bounds = sequelize.define('bounds', {
	figure_id: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	lat: {
		type: Sequelize.DECIMAL,
		unique: 'compositeKey',
		allowNull: false,
		validate: {
			min: -90,
			max: 90
		}
	},
	lng: {
		type: Sequelize.DECIMAL,
		unique: 'compositeKey',
		allowNull: false,
		validate: {
			min: -180,
			max: 180
		}
	}
},
{
	timestamps: false
});

module.exports = Bounds;
