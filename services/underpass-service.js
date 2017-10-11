const eventEmitter = require('./eventEmitter-service');
const ClientLocationObject = require('./location-service');
const EmptyLocationObject = require('./grid-service');
const Underpass = require('../models/underpass');

class UnderpassClientObject {
	constructor(underpass) {
		const underpassData = underpass.dataValues;

		const locFromData = underpassData.underpassFrom.dataValues;
		const locToData = underpassData.underpassTo.dataValues;

		this.from = EmptyLocationObject.calcCenterPoint({
			lat: +locFromData.lat,
			lng: +locFromData.lng
		});
		this.to = EmptyLocationObject.calcCenterPoint({
			lat: +locToData.lat,
			lng: +locToData.lng
		});

		this.coords = [
			this.from,
			this.to
		];
	}

	static getAllUnderpassesForUser(userId) {
		return ClientLocationObject.getUsersLocationIds(userId)
			.then((ids) => {
				const userLocIds1 = [];
				const userLocIds2 = [];

				ids.forEach((item) => {
					userLocIds1.push({
						loc_id_1: item
					});
					userLocIds2.push({
						loc_id_2: item
					});
				});

				return Underpass.findAllForByLocIdArray({
					userLocIds1,
					userLocIds2
				});
			})
			.then((underpasses) => {
				const underpassesClientObjects = [];

				underpasses.forEach((underpass) => {
					underpassesClientObjects.push(new UnderpassClientObject(underpass));
				});

				return underpassesClientObjects;
			});
	}

	static getAvailableLocIdsForUser(locFromId, userId) {
		let bounds;
		let excludedBounds;
		return ClientLocationObject.getNorthWestByLocId(locFromId)
			.then((northWestPoint) => {
				bounds = UnderpassClientObject.calcPermittedBoundsForLocation(northWestPoint, 5);
				excludedBounds = UnderpassClientObject.calcPermittedBoundsForLocation(northWestPoint, 1);

				return Underpass.getLocIdsAvailableInBounds(locFromId, userId, bounds, excludedBounds);
			})
			.then((allowedIds) => {
				const ids = [];

				allowedIds.forEach((item) => {
					ids.push(item.dataValues.id);
				});

				return ids;
			});
	}

	static createUnderpass(locationId1, locationId2) {
		const locationIdFrom = locationId1 < locationId2 ? locationId1 : locationId2;
		const locationIdTo = locationId1 > locationId2 ? locationId1 : locationId2;
		return UnderpassClientObject.calcUnderpassDistanceByLocIds(
			locationIdFrom,
			locationIdTo
		)
			.then(distance => Underpass.create({
				loc_id_1: locationIdFrom,
				loc_id_2: locationIdTo,
				distance_lat: distance.distanceLat,
				distance_lng: distance.distanceLng
			}));
	}

	static calcPermittedBoundsForLocation(northWestPoint, index) {
		const locGridObject = new EmptyLocationObject(northWestPoint);

		const relLatSize = EmptyLocationObject.relLatSize / 10000000;
		const relLngSize = locGridObject.relLngSize / 10000000;

		return {
			north: locGridObject.northWest.lat + (relLatSize * index),
			south: locGridObject.northWest.lat - (relLatSize * index),
			east: locGridObject.northWest.lng + (relLngSize * index),
			west: locGridObject.northWest.lng - (relLngSize * index)
		};
	}

	static calcUnderpassDistanceByLocIds(locationIdFrom, locationIdTo) {
		let locationFrom;
		let locationTo;
		return ClientLocationObject.getNorthWestByLocId(locationIdFrom)
			.then((northWestPoint) => {
				locationFrom = new EmptyLocationObject(northWestPoint);

				return ClientLocationObject.getNorthWestByLocId(locationIdTo);
			})
			.then((northWestPoint) => {
				locationTo = new EmptyLocationObject(northWestPoint);

				return UnderpassClientObject.calcUnderpassDistance(
					locationFrom,
					locationTo
				);
			});
	}

	static calcUnderpassDistance(locationFrom, locationTo) {
		let lngDistance = Math.round((locationFrom.northWest.lng - locationTo.northWest.lng)
				/ (locationFrom.relLngSize / 10000000));
		let latDistance = Math.round((locationFrom.northWest.lat - locationTo.northWest.lat)
				/ (EmptyLocationObject.relLatSize / 10000000));

		lngDistance = lngDistance < 0 ? -lngDistance : lngDistance;
		latDistance = latDistance < 0 ? -latDistance : latDistance;

		return {
			distanceLat: latDistance,
			distanceLng: lngDistance
		};
	}
}

module.exports = UnderpassClientObject;
