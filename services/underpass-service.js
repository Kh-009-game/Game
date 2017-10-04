const EmptyLocation = require('./grid-service');
const sequelize = require('./orm-service');
const eventEmitter = require('./eventEmitter-service');
const ClientLocationObject = require('./location-service');
const Underpass = require('../models/underpass');

class UnderpassClientObject {
	constructor(connection) {
		this.from = connection.from.center;
		this.to = connection.to.center;
		this.coords = [
			this.from,
			this.to
		];
	}

	static getAllUnderpassesForUser(userId) {
		return ClientLocationObject.getAllUsersClientLocationObjects(userId)
			.then((usersLocations) => {
				const connections = UnderpassClientObject.findConnections(usersLocations);

				let underpasses = [];

				connections.forEach((connection) => {
					underpasses.push(new UnderpassClientObject(connection));
				});

				underpasses = UnderpassClientObject.filterUnderpassesArray(underpasses);

				return underpasses;
			});
	}

	static findConnections(locArray) {
		const connections = [];

		locArray.forEach((location) => {
			location.underpassesTo.forEach((underpassToId) => {
				for (let i = 0, max = locArray.length; i < max; i += 1) {
					if (locArray[i].locationId === underpassToId) {
						connections.push({
							from: location,
							to: locArray[i]
						});
						break;
					}
				}
			});
		});

		return connections;
	}

	static filterUnderpassesArray(underpasses) {
		underpasses.forEach((underpass) => {
			for (let i = 0, max = underpasses.length; i < max; i += 1) {
				if (
					(underpasses[i].from.lat === underpass.to.lat) &&
					(underpasses[i].from.lng === underpass.to.lng) &&
					(underpasses[i].to.lat === underpass.from.lat) &&
					(underpasses[i].to.lng === underpass.from.lng)
				) {
					underpasses.splice(i, 1);
					break;
				}
			}
		});

		return underpasses;
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

module.exports = UnderpassClientObject;
