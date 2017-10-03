const EmptyLocation = require('./grid-service');
const sequelize = require('./orm-service');
const eventEmitter = require('./eventEmitter-service');
const ClientLocationObject = require('./location-service');
const Underpass = require('../models/underpass');

class UnderpassClientObject {
	constructor(locationFrom, locationTo) {
		this.begin = locationFrom.center;
		this.end = locationTo.center;
	}

	static getAllUnderpassesForUser(userId) {
		ClientLocationObject.getAllUsersClientLocationObjects(userId)
			.then();
	}

	static createUnderpassByUser(locationIdFrom, locationIdTo, userId) {
		UnderpassClientObject.calcUnderpassDistanceByLocIds(
			locationIdFrom,
			locationIdTo,
			userId
		)
			.then(distance => sequelize.transaction(
				trans => Underpass.create({
					location_id: locationIdFrom,
					underpass_id: locationIdTo,
					distance
				}, {
					transaction: trans
				})
					.then(() => Underpass.create({
						location_id: locationIdTo,
						underpass_id: locationIdFrom,
						distance
					}, {
						transaction: trans
					}))
			));
	}

	static calcUnderpassDistanceByLocIds(locationIdFrom, locationIdTo, userId) {
		let locationFrom;
		let locationTo;
		ClientLocationObject.createClientLocationObjectByIdForUser(
			locationIdFrom,
			userId
		)
			.then((foundLocationFrom) => {
				locationFrom = foundLocationFrom;
				return ClientLocationObject.createClientLocationObjectByIdForUser(
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
