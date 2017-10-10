const Sequelize = require('sequelize');
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
		const allowedIds = [];
		const prohibitedIds = [];
		let bounds;
		let excludeBounds;
		return Location.findById(locFromId)
			.then((location) => {
				bounds = UnderpassClientObject.calcPermittedBoundsForLocation(location, 5);
				excludeBounds = UnderpassClientObject.calcPermittedBoundsForLocation(location, 1);

				return Underpass.findAllForLocId(locFromId)
			})
			.then((underpasses) => {
				const ids = [];
				ids.push(locFromId);
				underpasses.forEach((item) => {
					const id1 = item.dataValues.loc_id_1;
					const id2 = item.dataValues.loc_id_2;
					ids.push(id1);
					ids.push(id2);
				});

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
			})
			.then((data) => {
				data.forEach((item) => {
					allowedIds.push(item.dataValues.id);
				});
				return Location.findAll({
					attributes: ['id'],
					where: {
						user_id: userId,
						lat: {
							[Sequelize.Op.and]: [{
								[Sequelize.Op.gte]: excludeBounds.south
							}, {
								[Sequelize.Op.lte]: excludeBounds.north
							}]
						},
						lng: {
							[Sequelize.Op.and]: [{
								[Sequelize.Op.gte]: excludeBounds.west
							}, {
								[Sequelize.Op.lte]: excludeBounds.east
							}]
						}
					}
				});
			})
			.then((data) => {
				data.forEach((item) => {
					prohibitedIds.push(item.dataValues.id);
				});

				return allowedIds.filter((item) => {
					if (!prohibitedIds.length) return item;
					for (let i = 0, max = prohibitedIds.length; i < max; i += 1) {
						if (item === prohibitedIds[i]) {
							prohibitedIds.splice(i, 1);
							return false;
						}
					}
					return item;
				});
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

	static calcPermittedBoundsForLocation(location, index) {
		const locGridObject = new EmptyLocationObject({
			lat: +location.dataValues.lat,
			lng: +location.dataValues.lng
		});

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
