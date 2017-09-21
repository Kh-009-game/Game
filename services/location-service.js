const Location = require('../models/location-orm');

const GridService = require('../services/grid-service');
const logService = require('../services/log-service');


class LocationService extends GridService {
	constructor(locationData) {
		super(locationData.northWest);

		this.masterId = locationData.userId;
		this.masterName = locationData.userName;
		this.locationId = locationData.locationId || null;
		this.population = locationData.population || 10;
		this.dailyBank = locationData.dailyBank || 0;
		this.loyalPopulation = locationData.loyalPopulation || 10;
		this.dailyCheckin = locationData.dailyCheckin === undefined ? true : locationData.dailyCheckin;
		this.creationDate = locationData.creationDate || new Date().toISOString();
		this.locationName = locationData.locationName || null;
		this.dailyMessage = locationData.dailyMessage || null;
	}

	static createClientLocationObjectByIdForUser(locationId, userId) {
		return Location.findById(locationId)
			.then((location) => {

			});
	}

	static getAllLocationsForUser(userId) {

	}

	static getAllLocationsGeoJSONForUser(userId) {
		return LocationService.getAllLocationsForUser(userId)
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

	static occupyLocationByUser(userId, locData) {

	}

	static getLocationOnPointForUser(userId, geoData) {

	}

	static checkOwnerOrAdminPermission(locationId, userId, isAdmin) {

	}

	static checkIsCurrentOrAdminPermission(locationId, userId, isAdmin) {

	}

	static checkOccupationOrAdminPermission(locationData, userGeodata, isAdmin) {

	}

	static updateLocation(locationNewData) {

	}

	static deleteLocation(locationId) {

	}

	static doCheckin(locationId) {

	}

	static takeDailyBank(locationId) {

	}

	static restoreLoyalPopulation(locationId) {

	}

	static recalcLocationsLifecycle() {
	}
}
module.exports = LocationService;
