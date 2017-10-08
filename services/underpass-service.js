const Sequelize = require('sequelize');
const sequelize = require('./orm-service');
const eventEmitter = require('./eventEmitter-service');
const ClientClusterObject = require('./cluster-service');
const EmptyLocationObject = require('./grid-service');
const Underpass = require('../models/underpass');
const Location = require('../models/location-orm');

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
		return ClientClusterObject.getUsersLocationIds(userId)
			.then((data) => {
				const userLocIds1 = [];
				const userLocIds2 = [];

				data.forEach((item) => {
					userLocIds1.push({
						loc_id_1: item.dataValues.id
					});
					userLocIds2.push({
						loc_id_2: item.dataValues.id
					});
				});

				return Underpass.findAll({
					where: {
						[Sequelize.Op.or]: [{
							[Sequelize.Op.or]: userLocIds1
						}, {
							[Sequelize.Op.or]: userLocIds2
						}]
					},
					include: [{
						model: Location,
						association: 'underpassFrom',
						as: 'underpassFrom'
					}, {
						model: Location,
						association: 'underpassTo',
						as: 'underpassTo'
					}]
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

	static getLocationsAbleToConnectByLocIdForUser(locationId, userId) {

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

	static calcUnderpassDistanceByLocIds(locationIdFrom, locationIdTo) {
		let locationFrom;
		let locationTo;
		return Location.findById(locationIdFrom)
			.then((foundLocationFrom) => {
				locationFrom = new EmptyLocationObject({
					lat: +foundLocationFrom.dataValues.lat,
					lng: +foundLocationFrom.dataValues.lng
				});

				return Location.findById(locationIdTo);
			})
			.then((foundLocationTo) => {
				locationTo = new EmptyLocationObject({
					lat: +foundLocationTo.dataValues.lat,
					lng: +foundLocationTo.dataValues.lng
				});

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
