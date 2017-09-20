const Location = require('../models/location-orm');

const EmptyLocation = require('../models/emptyLocation');
const logService = require('../services/log-service');
const sockets = require('../services/sockets');
const db = require('../services/db-transport');


class OccupiedLocation extends EmptyLocation {
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

	doCheckin() {
	}

	takeDailyBank() {
	}

	restoreLoyalPopulation() {
	}

	static getAllLocationsGeoJSON() {
		return OccupiedLocation.getAllLocations()
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
			})

			);
	}

	static checkLocationOnCoords(coords) {
	}

	static recalcLocationsLifecycle() {
	}
}
module.exports = OccupiedLocation;
