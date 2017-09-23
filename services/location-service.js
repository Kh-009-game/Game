const Location = require('../models/location-orm');

const EmptyLocation = require('../services/grid-service');
const logService = require('../services/log-service');

function createClientLocationObjectByIdForUser(locationId, userId) {
	return Location.findById(locationId)
		.then(location => new ClientLocationObject(location.dataValues));
}

class ClientLocationObject extends EmptyLocation {
	constructor(location, userId) {
		super({
			lat: location.lat,
			lng: location.lng
		});

		this.masterId = location.userId;
		this.masterName = location.userName;
		this.locationId = location.locationId || null;
		this.population = location.population || 10;
		this.hasDailyBank = location.dailyBank || 0;
		this.loyalPopulation = location.loyalPopulation || 10;
		this.dailyCheckin = locationData.dailyCheckin;
		this.creationDate = location.created_at;
		this.locationName = location.name;
		this.dailyMessage = location.daily_msg;
		this.isMaster = location.user_id === userId;
	}
}

function getAllLocationsForUser(userId) {
	return Location.findAll()
		.then((locations) => {

		});
}

function getAllLocationsGeoJSONForUser(userId) {
	return getAllLocationsForUser(userId)
		.then(locArray => new Promise((res) => {
			const geoObj = {
				type: 'FeatureCollection',
				features: []
			};
			locArray.forEach((item) => {
				geoObj.features.push({
					type: 'Feature',
					id: item.locationId,
					properties: {
						color: 'gray',
						background: 'gray',
						info: {
							masterId: item.masterId,
							dailyBank: item.dailyBank > 0,
							population: item.population
						}
					},
					geometry: {
						type: 'Polygon',
						coordinates: [
							item.mapFeatureGeometry
						]
					}
				});
			});
			res(geoObj);
		}));
}

function occupyLocationByUser(userId, locData) {

}

function getLocationOnPointForUser(userId, geoData) {

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

module.exports.createClientLocationObjectByIdForUser = createClientLocationObjectByIdForUser;
module.exports.createClientLocationObjectByIdForUser = createClientLocationObjectByIdForUser;
