const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');
const EmptyLocation = require('../services/grid-service');


const Location = sequelize.define('location', {
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
		defaultValue: ''
	},
	population: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 10
	},
	loyal_population: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 10,
		validate: {
			min: 0
		}
	},
	taking_bank_date: {
		type: Sequelize.DATE,
		allowNull: false,
		defaultValue: Sequelize.NOW
	},
	checkin_date: {
		type: Sequelize.DATE,
		allowNull: false,
		defaultValue: Sequelize.NOW
	}
}, {
	underscored: true,
	validate: {
		gridValidation() {
			if (EmptyLocation.validateLocationCoords({
				lat: this.lat,
				lng: this.lng
			})) {
				throw new Error('Location coordinates are not valid!');
			}
		}
	}
});

module.exports = Location;
