const Sequelize = require('sequelize');
const sequelize = require('./orm-service');
const eventEmitter = require('./eventEmitter-service');
const ClientClusterObject = require('./cluster-service');
const EmptyObject = require('./grid-service');
const Underpass = require('../models/underpass');
const Location = require('../models/location-orm');

class UnderpassClientObject {
	constructor(underpass) {
		const underpassData = underpass.dataValues;

		const locFromData = underpassData.underpassFrom.dataValues;
		const locToData = underpassData.underpassTo.dataValues;

		this.from = EmptyObject.calcCenterPoint({
			lat: +locFromData.lat,
			lng: +locFromData.lng
		});
		this.to = EmptyObject.calcCenterPoint({
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

	static createUnderpassByUser(locationId1, locationId2, userId) {
		const locationIdFrom = locationId1 < locationId2 ? locationId1 : locationId2;
		const locationIdTo = locationId1 > locationId2 ? locationId1 : locationId2;
		UnderpassClientObject.calcUnderpassDistanceByLocIds(
			locationIdFrom,
			locationIdTo,
			userId
		)
			.then(distance => Underpass.create({
				loc_id_1: locationIdFrom,
				loc_id_2: locationIdTo,
				distance
			}));
	}

	static calcUnderpassDistanceByLocIds(locationIdFrom, locationIdTo, userId) {
		let locationFrom;
		let locationTo;
		ClientClusterObject.createClientLocationObjectByIdForUser(
			locationIdFrom,
			userId
		)
			.then((foundLocationFrom) => {
				locationFrom = foundLocationFrom;
				return ClientClusterObject.createClientLocationObjectByIdForUser(
					locationIdTo,
					userId
				);
			})
			.then((foundLocationTo) => {
				locationTo = foundLocationTo;

				return UnderpassClientObject.calcUnderpassDistance(
					locationFrom,
					locationTo
				);
			});
	}

	static calcUnderpassDistance(locationFrom, locationTo) {
		const lngDistance = (locationFrom.northWest.lng - locationTo.northWest.lng)
				/ locationFrom.relLngSize;
		const latDistance = (locationFrom.northWest.lat - locationTo.northWest.lat)
				/ locationFrom.relLatSize;
		const distance = Math.sqrt(
			Math.pow(lngDistance, 2) + Math.pow(latDistance, 2)
		);

		return distance;
	}
}

module.exports = UnderpassClientObject;
