const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');
const EmptyLocation = require('../services/grid-service');
const boundsService = require('../services/bounds-service');


const Location = sequelize.define('location', {
	lat: {
		type: Sequelize.DECIMAL,
		unique: 'coords',
		allowNull: false,
		validate: {
			min: -90,
			max: 90,
			gridValidation() {
				if (!EmptyLocation.validateLatitude(
					this.dataValues.lat
				)) {
					throw new Error('Latitude is not valid!');
				}
			},
			isAllowed() {
				const latLng = {
					lat: this.dataValues.lat,
					lng: this.dataValues.lng
				};
				if (!boundsService.getEmptyLocationWithIsAllowedProp(latLng, true)) {
					throw new Error('Out of bounds');
				}
			}
		}
	},
	lng: {
		type: Sequelize.DECIMAL,
		unique: 'coords',
		allowNull: false,
		validate: {
			min: -180,
			max: 180,
			gridValidation() {
				if (!EmptyLocation.validateLongitude(
					this.dataValues.lat,
					this.dataValues.lng
				)) {
					throw new Error('Longitude is not valid!');
				}
			},
			isAllowed() {
				const latLng = {
					lat: this.dataValues.lat,
					lng: this.dataValues.lng
				};
				if (!boundsService.getEmptyLocationWithIsAllowedProp(latLng, true)) {
					throw new Error('Out of bounds');
				}
			}
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
},
{
	underscored: true
});

module.exports = Location;
