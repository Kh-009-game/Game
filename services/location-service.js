const Location = require('../models/location-orm');
const User = require('../models/user-orm');
const EmptyLocation = require('./grid-service');
const logService = require('./log-service');
const sequelize = require('./orm-service');
const eventEmitter = require('./eventEmitter-service');


class ClientLocationObject extends EmptyLocation {
	constructor(location, userId) {
		const locationData = location.dataValues;
		const masterData = location.user.dataValues;
		const lastLifeCycleEventDate = locationData.lastLifeCycleEventDate;

		super({
			lat: location.dataValues.lat,
			lng: location.dataValues.lng
		});

		this.masterId = locationData.user_id;
		this.masterName = masterData.name;
		this.locationId = locationData.id;
		this.population = locationData.population;
		this.hasDailyBank = locationData.taking_bank_date < lastLifeCycleEventDate;
		this.loyalPopulation = locationData.loyal_population;
		this.dailyCheckin = locationData.daily_checkin_date < lastLifeCycleEventDate;
		this.creationDate = locationData.created_at;
		this.locationName = locationData.name;
		this.dailyMessage = locationData.daily_msg;
		this.isMaster = locationData.user_id === userId;
	}

	static createClientLocationObjectByIdForUser(locationId, userId) {
		return Location.findById(locationId, {
			include: {
				model: User
			}
		})
			.then(location => logService.getLastLifeCycleEventDate()
				.then((lastLifeCycleEventDate) => {
					location.dataValues.lastLifeCycleEventDate = lastLifeCycleEventDate;
					return new ClientLocationObject(location, userId);
				})
			);
	}

	static getAllClientLocationObjectsForUser(userId) {
		return Location.findAll({
			include: {
				model: User
			}
		})
			.then(locations => logService.getLastLifeCycleEventDate()
				.then((lastLifeCycleEventDate) => {
					const clientLocationsArray = [];
					locations.forEach((item) => {
						item.dataValues.lastLifeCycleEventDate = lastLifeCycleEventDate;
						clientLocationsArray.push(new ClientLocationObject(location, userId));
					});
					return clientLocationsArray;
				})
			);
	}

	static occupyLocationByUser(userId, locData) {
		return Location.create({
			lat: locData.lat,
			lng: locData.lng,
			name: locData.name,
			daily_msg: locData.dailyMessage,
			user_id: userId
		}, {
			include: [User]
		})
			.then(() => {
				eventEmitter.emit('location-created', {
					lat: locData.lat,
					lng: locData.lng
				});
			});
	}

	static getLocationOnPointForUser(userId, geoData) {
		const locNorthWest = EmptyLocation.calcNorthWestByPoint(geoData);

		return Location.findOne({
			where: {
				lat: locNorthWest.lat,
				lng: locNorthWest.lng
			}
		})
			.then(location => (location ?
				ClientLocationObject.createClientLocationObjectByIdForUser(location, userId) :
				new EmptyLocation(locNorthWest)));
	}

	static updateLocation(locationId, newLocData) {
		return Location.update({
			name: newLocData.name,
			daily_msg: newLocData.dailyMessage
		}, {
			where: {
				loc_id: locationId
			}
		})
			.then(() => {
				eventEmitter.emit('location-updated', {
					locationId
				});
			});
	}

	static deleteLocation(locationId) {
		return Location.destroy({
			where: {
				loc_id: locationId
			}
		})
			.then(() => {
				eventEmitter.emit('location-deleted', {
					locationId
				});
			});
	}

	static doCheckin(locationId) {
		return Location.update({
			checkin_date: new Date()
		}, {
			where: {
				loc_id: locationId
			}
		})
			.then(() => {
				eventEmitter.emit('location-updated', {
					locationId
				});
			});
	}

	static takeDailyBank(locationId) {
		Location.findById(locationId)
			.then((location) => {
				const bank = location.dataValues.loyal_population;
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
			})
			.then(() => {
				eventEmitter.emit('location-updated', {
					locationId
				});
			});
	}

	static restoreLoyalPopulationByUser(locationId, userId) {
		Location.findById(locationId)
			.then((location) => {
				const loyalPopulation = location.dataValues.loyal_population;
				const population = location.dataValues.population;
				sequelize.transaction(
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
			})
			.then(() => {
				eventEmitter.emit('location-updated', {
					locationId
				});
			});
	}

	static recalcLocationsLifecycle() {
		return sequelize.transaction(trans => logService.system({
			status: 'daily-event',
			message: 'Daily event '
		}, {
			transaction: trans
		})
			.then(() => logService.getLastLifeCycleEventDate()
				.then(lastLifeCycleEventDate => Location.destroy({
					where: {
						loyal_population: 0,
						daily_checkin_date: {
							$lt: lastLifeCycleEventDate
						}
					},
					transaction: trans
				})
					.then(() => Location.update({
						loyal_population: sequelize.literal('loyal_population - ceil(loyal_population * 0.1)')
					}, {
						where: {
							daily_checkin_date: {
								$lt: lastLifeCycleEventDate
							}
						},
						transaction: trans
					}))
				)
			)
		)
			.then(() => {
				eventEmitter.emit('daily-event');
			});
	}

	static checkOwnerOrAdminPermission(locationId, userId, isAdmin) {
		if (isAdmin) {
			return Promise.resolve({
				isAdmin
			});
		}
		return Location.findById(locationId)
			.then((location) => {
				if (userId === location.dataValues.user_id) {
					throw new Error('No such rights!');
				}
				return {
					locationData: location
				};
			});
	}

	static checkIsCurrentAndOwnerOrAdminPermission(locationId, userGeodata, userId, isAdmin) {
		ClientLocationObject.checkOwnerOrAdminPermission(locationId, userId, isAdmin)
			.then((result) => {
				ClientLocationObject.checkIsCurrentPermission(
					result.locationData.dataValues,
					userId,
					isAdmin
				);
				return result;
			});
	}

	static checkDailyBankPresenceAndPermission(locationId, userGeodata, userId, isAdmin) {
		ClientLocationObject.checkIsCurrentAndOwnerOrAdminPermission(
			locationId,
			userGeodata,
			userId,
			isAdmin
		)
			.then((result) => {
				if (!result.locationData) {
					return Location.findById(locationId);
				}
				return result.locationData;
			})
			.then(location => logService.getLastLifeCycleEventDate()
				.then((lastLifeCycleEventDate) => {
					const takingBankData = location.locationData.taking_bank_date;

					if (takingBankData > lastLifeCycleEventDate) {
						throw new Error('There\'s no any bank');
					}
					location.dataValues.lastLifeCycleEventDate = lastLifeCycleEventDate;
					return location;
				}));
	}

	static checkIsCurrentPermission(locationData, userGeodata, isAdmin) {
		if (isAdmin) return;

		const properLocCoords = EmptyLocation.calcNorthWestByPoint(userGeodata);

		if ((locationData.lng !== properLocCoords.lng) ||
				(locationData.lat !== properLocCoords.lat)) {
			throw new Error('You have to be there to do that!');
		}
	}
}

module.exports = ClientLocationObject;
