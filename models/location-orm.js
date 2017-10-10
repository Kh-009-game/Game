const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');
const EmptyLocation = require('../services/grid-service');
const boundsService = require('../services/bounds-service');
const LifeCycleEvent = require('../models/lifecycle-event');
const User = require('../models/user-orm');


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
	saved_bank: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0,
		validate: {
			min: 0
		}
	},
	checkin_date: {
		type: Sequelize.DATE,
		allowNull: false,
		defaultValue: Sequelize.NOW
	},
	lifecycle_id: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 1
	}
},
{
	underscored: true
});

Location.findByIdAllIncluded = id => Location.findById(id, {
	include: [User, LifeCycleEvent]
});

Location.findAllAllIncluded = () => Location.findAll({
	include: [User, LifeCycleEvent]
});

Location.occupyByUser = (userId, locData) => sequelize
	.transaction(trans => Location.count({
		where: {
			lat: locData.northWest.lat,
			lng: locData.northWest.lng
		},
		transaction: trans
	})
		.then((count) => {
			if (count !== 0) {
				throw new Error('Location has been already occupied');
			}
			return Location.create({
				lat: locData.northWest.lat,
				lng: locData.northWest.lng,
				name: locData.locationName,
				daily_msg: locData.dailyMessage,
				user_id: userId
			}, {
				include: [User, LifeCycleEvent],
				transaction: trans
			});
		})
	);

Location.findOnPoint = point => Location.findOne({
	where: {
		lat: point.lat,
		lng: point.lng
	}
});

Location.editById = (locationId, newLocData) => Location.update({
	name: newLocData.name,
	daily_msg: newLocData.dailyMessage
}, {
	where: {
		id: locationId
	}
});

Location.deleteById = locationId => Location.destroy({
	where: {
		id: locationId
	}
});

Location.doCheckinById = locationId => Location.update({
	checkin_date: new Date()
}, {
	where: {
		id: locationId
	}
});

Location.takeDailyBankById = locationId => Location.findById(locationId)
	.then((location) => {
		const locationData = location.dataValues;
		const bank = locationData.loyal_population + locationData.saved_bank;
		const masterId = location.dataValues.user_id;
		return sequelize.transaction(
			trans => Location.update({
				taking_bank_date: new Date()
			}, {
				where: {
					id: locationId
				},
				transaction: trans
			})
				.then(() => User.update({
					cash: sequelize.literal(`cash + ${bank}`)
				}, {
					where: {
						id: masterId
					},
					transaction: trans
				}))
		);
	});

Location.restoreLoyalPopulationByUserById = (locationId, userId) => Location
	.findById(locationId)
	.then((location) => {
		const loyalPopulation = location.dataValues.loyal_population;
		const population = location.dataValues.population;
		return sequelize.transaction(
			trans => Location.update({
				loyal_population: population
			}, {
				where: {
					id: locationId
				},
				transaction: trans
			})
				.then(() => User.update({
					cash: sequelize.literal(`cash - ${population - loyalPopulation}`)
				}, {
					where: {
						id: userId
					},
					transaction: trans
				}))
		);
	});

Location.recalcLocationsLifecycle = lastLifeCycleEventDate => sequelize
	.transaction(trans => Location.destroy({
		where: {
			loyal_population: 0,
			checkin_date: {
				[Sequelize.Op.lt]: lastLifeCycleEventDate
			}
		}
	})
		.then(() => Location.update({
			saved_bank: sequelize.literal('saved_bank + loyal_population')
		}, {
			where: {
				taking_bank_date: {
					[Sequelize.Op.lt]: lastLifeCycleEventDate
				}
			},
			transaction: trans
		}))
		.then(() => Location.update({
			loyal_population: sequelize.literal('loyal_population - ceil(loyal_population * 0.1)')
		}, {
			where: {
				checkin_date: {
					[Sequelize.Op.lt]: lastLifeCycleEventDate
				}
			},
			transaction: trans
		}))
	);

Location.User = Location.belongsTo(User);
User.Locations = User.hasMany(Location);

Location.LifeCycleEvent = Location.belongsTo(LifeCycleEvent);
LifeCycleEvent.hasMany(Location);

module.exports = Location;
