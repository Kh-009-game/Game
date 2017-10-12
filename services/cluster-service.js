const ClientLocationObject = require('./location-service.js');
const Location = require('../models/location-orm');
const User = require('../models/user-orm');
const sequelize = require('./orm-service');
const logService = require('./log-service');
const eventEmitter = require('./eventEmitter-service');

class ClientClusterObject extends ClientLocationObject {
	constructor(location, userId) {
		super(location, userId);

		const locationData = location.dataValues;
		const underpassesTo = [];

		if (Array.isArray(locationData.UnderpassTo)) {
			locationData.UnderpassTo.forEach((item) => {
				underpassesTo.push(item.dataValues.id);
			});
			locationData.UnderpassFrom.forEach((item) => {
				underpassesTo.push(item.dataValues.id);
			});
		}

		this.underpassesTo = underpassesTo;
	}

	// static createClientClusterObjectByIdForUser(locationId, userId) {
	// 	return Location.findById(locationId, {
	// 		include: [{
	// 			model: User
	// 		}, {
	// 			model: Location,
	// 			as: 'underpassTo'
	// 		}, {
	// 			model: Location,
	// 			as: 'underpassFrom'
	// 		}]
	// 	})
	// 		.then(location => logService.getLastLifeCycleEventDate()
	// 			.then((lastLifeCycleEventDate) => {
	// 				location.dataValues.lastLifeCycleEventDate = lastLifeCycleEventDate;
	// 				return new ClientClusterObject(location, userId);
	// 			})
	// 		);
	// }

	// static getUsersLocationIds(userId) {
	// 	return Location.findAll({
	// 		attributes: ['id'],
	// 		where: {
	// 			user_id: userId
	// 		}
	// 	});
	// }

	// static getNorthWestByLocId(id) {
	// 	return Location.findById(id, {
	// 		attributes: ['lat', 'lng']
	// 	})
	// 		.then((location) => {
	// 			const northWest = {
	// 				lat: location.dataValues.lat,
	// 				lng: location.dataValues.lng
	// 			};
	// 			return northWest;
	// 		});
	// }
}

module.exports = ClientClusterObject;
