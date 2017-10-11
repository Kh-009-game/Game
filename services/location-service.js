const Location = require('../models/location-orm');
const EmptyLocation = require('./grid-service');
const eventEmitter = require('./eventEmitter-service');
const Locker = require('./locker-service');

const locker = new Locker(new Error('Location is being occupied!'));

class ClientLocationObject extends EmptyLocation {
	constructor(location, userId) {
		const locationData = location.dataValues;
		const masterData = location.user.dataValues;
		const lastLifeCycleEventDate = location.lifecycle.dataValues.updated_at;

		super({
			lat: +location.dataValues.lat,
			lng: +location.dataValues.lng
		}, true);

		this.masterId = locationData.user_id;
		this.masterName = masterData.name;
		this.locationId = locationData.id;
		this.population = locationData.population;
		this.loyalPopulation = locationData.loyal_population;
		this.hasDailyBank = locationData.taking_bank_date < lastLifeCycleEventDate;
		this.dailyBank = this.hasDailyBank ?
			this.loyalPopulation + locationData.saved_bank :
			0;
		this.dailyCheckin = locationData.checkin_date > lastLifeCycleEventDate;
		this.creationDate = locationData.created_at;
		this.locationName = locationData.name;
		this.dailyMessage = locationData.daily_msg;
		this.isMaster = locationData.user_id === userId;
	}

	static createClientLocationObjectByIdForUser(locationId, userId) {
		return Location.findByIdAllIncluded(locationId)
			.then(location => new ClientLocationObject(location, userId));
	}

	static getAllClientLocationObjectsForUser(userId) {
		return Location.findAllAllIncluded()
			.then((locations) => {
				const clientLocationsArray = [];
				locations.forEach((location) => {
					clientLocationsArray.push(new ClientLocationObject(location, userId));
				});
				return clientLocationsArray;
			});
	}

	static occupyLocationByUser(userId, locData) {
		const key = {
			lat: locData.northWest.lat,
			lng: locData.northWest.lng
		};

		locker.validateKey(key);

		return Location.occupyByUser(userId, locData)
			.then(() => {
				eventEmitter.emit('location-created', {
					lat: locData.northWest.lat,
					lng: locData.northWest.lng
				});
				locker.deleteKey(key);
			})
			.catch((err) => {
				locker.deleteKey(key);
				throw err;
			});
	}

	static getLocationOnPointForUser(userId, geoData, isAllowed) {
		const locNorthWest = EmptyLocation.calcNorthWestByPoint(geoData);
		return Location.findOnPoint(locNorthWest)
			.then((location) => {
				if (!location) {
					return new EmptyLocation(locNorthWest, isAllowed);
				}
				return ClientLocationObject.createClientLocationObjectByIdForUser(
					location.dataValues.id,
					userId
				);
			});
	}

	static updateLocation(locationId, newLocData) {
		return Location.editById(locationId, newLocData)
			.then(() => {
				eventEmitter.emit('location-updated', {
					locationId
				});
			});
	}

	static deleteLocationById(locationId) {
		return Location.deleteById(locationId)
			.then(() => {
				eventEmitter.emit('location-deleted', {
					locationId
				});
			});
	}

	static doCheckinById(locationId) {
		return Location.doCheckinById(locationId)
			.then(() => {
				eventEmitter.emit('location-updated', {
					locationId
				});
			});
	}

	static takeDailyBankById(locationId) {
		return Location.takeDailyBankById(locationId)
			.then(() => {
				eventEmitter.emit('location-updated', {
					locationId
				});
			});
	}

	static restoreLoyalPopulationByUser(locationId, userId) {
		return Location.restoreLoyalPopulationByUserById(locationId, userId)
			.then(() => {
				eventEmitter.emit('location-updated', {
					locationId
				});
			});
	}

	static recalcLocationsLifecycle(lastLifeCycleEventDate) {
		return Location.recalcLocationsLifecycle(lastLifeCycleEventDate);
	}

	static checkOwnerOrAdminPermission(locationId, userId, isAdmin) {
		if (isAdmin) {
			return Promise.resolve({
				isAdmin
			});
		}
		return Location.findByIdAllIncluded()
			.then((location) => {
				if (userId !== location.dataValues.user_id) {
					throw new Error('No such rights!');
				}
				return {
					locationData: location
				};
			});
	}

	static checkIsCurrentAndOwnerOrAdminPermission(locationId, userGeodata, userId, isAdmin) {
		return ClientLocationObject.checkOwnerOrAdminPermission(locationId, userId, isAdmin)
			.then((result) => {
				const locationData = result.locationData || {};
				ClientLocationObject.checkIsCurrentPermission(
					locationData.dataValues,
					userGeodata,
					isAdmin
				);
				return result;
			});
	}

	static checkDailyBankPresenceAndPermission(locationId, userGeodata, userId, isAdmin) {
		return ClientLocationObject.checkIsCurrentAndOwnerOrAdminPermission(
			locationId,
			userGeodata,
			userId,
			isAdmin
		)
			.then((result) => {
				if (!result.locationData) {
					return Location.findByIdAllIncluded(locationId);
				}
				return result.locationData;
			})
			.then((location) => {
				const takingBankData = location.dataValues.taking_bank_date;
				const lifecycleDate = location.lifecycle.dataValues.updated_at;

				if (takingBankData > lifecycleDate) {
					throw new Error('There\'s no any bank');
				}
				return location;
			});
	}

	static checkIsCurrentPermission(locationData, userGeodata, isAdmin) {
		if (isAdmin) return;

		const properLocCoords = EmptyLocation.calcNorthWestByPoint(userGeodata);

		if ((+locationData.lng !== properLocCoords.lng) ||
				(+locationData.lat !== properLocCoords.lat)) {
			throw new Error('You have to be there to do that!');
		}
	}

	static getUsersLocationIds(userId) {
		return Location.getUsersLocIds(userId)
			.then((locations) => {
				const ids = [];

				locations.forEach((item) => {
					ids.push(item.dataValues.id);
				});

				return ids;
			});
	}

	static getNorthWestByLocId(locId) {
		return Location.getNorthWestById(locId)
			.then((location) => {
				const northWest = {
					lat: +location.dataValues.lat,
					lng: +location.dataValues.lng
				};
				return northWest;
			});
	}
}

module.exports = ClientLocationObject;
