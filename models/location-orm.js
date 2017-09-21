const Sequelize = require('sequelize');
const sequelize = require('../services/orm-service');

const Location = sequelize.define('location', {
	loc_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		unique: true,
		allowNull: false,
		primaryKey: true
	},
	lat: {
		type: Sequelize.DECIMAL,
		unique: 'coords',
		allowNull: false,
		validate: {
			min: -90,
			max: 90
		}
	},
	lng: {
		type: Sequelize.DECIMAL,
		unique: 'coords',
		allowNull: false,
		validate: {
			min: -180,
			max: 180
		}
	},
	name: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			isAlphanumeric: true
		}
	},
	daily_msg: {
		type: Sequelize.TEXT,
		defaultValue: '',
		validate: {
			isAlphanumeric: true
		}
	},
	population: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 10
	},
	loyal_population: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 10
	},
	bank_take_date: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	checkin_date: {
		type: Sequelize.DATE,
		allowNull: false,
		defaultValue: Sequelize.NOW
	}
});

module.exports = Location;
