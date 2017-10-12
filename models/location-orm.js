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

Location.doCheckinById = (locationId) => {
	let lifeCycleDate;
	let locIds;
	return LifeCycleEvent.findById(1, {
		attributes: ['updated_at']
	})
		.then((data) => {
			lifeCycleDate = data.dataValues.updated_at;

			return Location.findAllConnectedLocIdsById(locationId);
		})
		.then((ids) => {
			locIds = ids;
			return Location.update({
				checkin_date: new Date()
			}, {
				where: {
					id: {
						[Sequelize.Op.in]: locIds
					},
					checkin_date: {
						[Sequelize.Op.lt]: lifeCycleDate
					}
				}
			});
		});
};

Location.takeDailyBankById = (locationId) => {
	let lifeCycleDate;
	let locIds;
	let masterId;
	return LifeCycleEvent.findById(1, {
		attributes: ['updated_at']
	})
		.then((data) => {
			lifeCycleDate = data.dataValues.updated_at;

			return Location.findAllConnectedLocIdsById(locationId);
		})
		.then((ids) => {
			locIds = ids;
			return Location.findAll({
				attributes: ['loyal_population', 'saved_bank', 'user_id'],
				where: {
					id: {
						[Sequelize.Op.in]: locIds
					},
					taking_bank_date: {
						[Sequelize.Op.lt]: lifeCycleDate
					}
				}
			});
		})
		.then((locations) => {
			let bank = 0;

			masterId = locations[0].dataValues.user_id;

			locations.forEach((location) => {
				bank += location.dataValues.loyal_population;
				bank += location.dataValues.saved_bank;
			});

			return sequelize.transaction(trans => Location.update({
				saved_bank: 0,
				taking_bank_date: new Date()
			}, {
				where: {
					id: {
						[Sequelize.Op.in]: locIds
					}
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
				})
				));
		});
};

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


Location.recalcLocationsLifecycle = () => {
	let LifeCycleEventDate;

	return LifeCycleEvent.findById(1)
		.then((data) => {
			LifeCycleEventDate = data.dataValues.updated_at;
			return Promise.resolve();
		})
		.then(() => sequelize.transaction(trans =>	LifeCycleEvent.update({
			updated_at: Sequelize.NOW
		}, {
			where: {
				id: 1
			},
			transaction: trans
		})
			.then(() => Location.destroy({
				where: {
					loyal_population: 0,
					checkin_date: {
						[Sequelize.Op.lt]: LifeCycleEventDate
					}
				}
			})
				.then(() => Location.update({
					saved_bank: sequelize.literal('saved_bank + loyal_population')
				}, {
					where: {
						taking_bank_date: {
							[Sequelize.Op.lt]: LifeCycleEventDate
						}
					},
					transaction: trans
				}))
				.then(() => Location.update({
					loyal_population: sequelize.literal('loyal_population - ceil(loyal_population * 0.1)')
				}, {
					where: {
						checkin_date: {
							[Sequelize.Op.lt]: LifeCycleEventDate
						}
					},
					transaction: trans
				})))
		));
};

Location.findUdersLocIdsInRectangleByLocId = (bounds, userId, excludedIds) => {
	const ids = excludedIds || [];
	return Location.findAll({
		attributes: ['id'],
		where: {
			user_id: userId,
			id: {
				[Sequelize.Op.notIn]: ids
			},
			lat: {
				[Sequelize.Op.and]: [{
					[Sequelize.Op.gte]: bounds.south
				}, {
					[Sequelize.Op.lte]: bounds.north
				}]
			},
			lng: {
				[Sequelize.Op.and]: [{
					[Sequelize.Op.gte]: bounds.west
				}, {
					[Sequelize.Op.lte]: bounds.east
				}]
			}
		}
	});
};

Location.findAllLocsIdsExcept = (incIds, excIds) => Location
	.findAll({
		attributes: ['id'],
		where: {
			id: {
				[Sequelize.Op.and]: [{
					[Sequelize.Op.in]: incIds
				}, {
					[Sequelize.Op.notIn]: excIds
				}]
			}
		},
		include: [{
			model: User
		}, {
			attributes: ['id'],
			model: Location,
			as: 'underpassTo'
		}, {
			attributes: ['id'],
			model: Location,
			as: 'underpassFrom'
		}]
	});

Location.findAllConnectedLocIdsById = (locId) => {
	let	includedIds = [locId];
	let excludedIds = [];
	return new Promise((res) => {
		findAllConnectedLocIdsById(includedIds, excludedIds);

		function findAllConnectedLocIdsById(incIds, excIds) {
			excIds = excIds || [];
			return Location.findAllLocsIdsExcept(incIds, excIds)
				.then((locations) => {
					excludedIds = excludedIds.concat(includedIds);

					includedIds = [];

					locations.forEach((item) => {
						item.underpassTo.forEach(extractIds);
						item.underpassFrom.forEach(extractIds);
					});

					includedIds = includedIds.filter(id => (excludedIds.indexOf(id) === -1));

					if (includedIds.length === 0) {
						res(excludedIds);
					}

					findAllConnectedLocIdsById(includedIds, excludedIds);
				});
		}

		function extractIds(connectedLoc) {
			const newId = connectedLoc.dataValues.id;
			if (includedIds.indexOf(newId) === -1) {
				includedIds.push(newId);
			}
		}
	});
};

Location.getUsersLocIds = userId =>	Location.findAll({
	attributes: ['id'],
	where: {
		user_id: userId
	}
});

Location.getNorthWestById = locId => Location.findById(locId, {
	attributes: ['lat', 'lng']
});

Location.findAllUsersLocIdsWithinRectangle = (bounds, userId, excludedIds) => {
	const ids = excludedIds || [];
	return Location.findAll({
		attributes: ['id'],
		where: {
			user_id: userId,
			id: {
				[Sequelize.Op.notIn]: ids
			},
			lat: {
				[Sequelize.Op.and]: [{
					[Sequelize.Op.gte]: bounds.south
				}, {
					[Sequelize.Op.lte]: bounds.north
				}]
			},
			lng: {
				[Sequelize.Op.and]: [{
					[Sequelize.Op.gte]: bounds.west
				}, {
					[Sequelize.Op.lte]: bounds.east
				}]
			}
		}
	});
};

Location.User = Location.belongsTo(User);
User.Locations = User.hasMany(Location);

Location.LifeCycleEvent = Location.belongsTo(LifeCycleEvent);
LifeCycleEvent.hasMany(Location);

module.exports = Location;
