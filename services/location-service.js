const Location = require('../models/location-orm');
const User = require('../models/user-orm');
const EmptyLocation = require('../services/grid-service');
const logService = require('../services/log-service');


class ClientLocationObject extends EmptyLocation {
	constructor(location, userId) {
		const locationData = location.dataValues;
		const userData = location.user.dataValues;
		const lastLifeCycleEventDate = locationData.lastLifeCycleEventDate;

		super({
			lat: location.dataValues.lat,
			lng: location.dataValues.lng
		});

		this.masterId = locationData.user_id;
		this.masterName = userData.name;
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
}


function checkOwnerOrAdminPermission(locationId, userId, isAdmin) {

}

function checkIsCurrentOrAdminPermission(locationId, userId, isAdmin) {

}

function checkOccupationOrAdminPermission(locationData, userGeodata, isAdmin) {

}

function updateLocation(locationNewData) {

}

function deleteLocation(locationId) {

}

function doCheckin(locationId) {

}

function takeDailyBank(locationId) {

}

function restoreLoyalPopulation(locationId) {

}

function recalcLocationsLifecycle() {
}

module.exports = ClientLocationObject;
