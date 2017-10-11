const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');
const Location = require('./location-orm');
// const EmptyLocationObject = require('../services/grid-service');


const Underpass = sequelize.define('underpass', {
	loc_id_1: {
		type: Sequelize.INTEGER,
		allowNull: false,
		validate: {
			locIdValidation() {
				if (this.dataValues.loc_id_1 === this.dataValues.loc_id_2) {
					throw new Error('You can\'t connect same location!');
				}

				if (this.dataValues.loc_id_1 > this.dataValues.loc_id_2) {
					throw new Error('loc_id_1 can\'t be bigger than loc_id_2!');
				}
			},
			locMasterValidation() {
				Location.findOne({
					attributes: ['user_id'],
					where: {
						id: this.dataValues.loc_id_1
					}
				})
					.then((location1) => {
						Location.findOne({
							attributes: ['user_id'],
							where: {
								id: this.dataValues.loc_id_2
							}
						})
							.then((location2) => {
								if (location1.dataValues.user_id !== location2.dataValues.user_id) {
									throw new Error('You can connect only locations of the same master!');
								}
							});
					});
			}
		}
	},
	distance_lng: {
		type: Sequelize.INTEGER,
		allowNull: false,
		validate: {
			max: 5
		}
	},
	distance_lat: {
		type: Sequelize.INTEGER,
		allowNull: false,
		validate: {
			max: 5
		}
	}
}, {
	underscored: true
});

Underpass.findAllForByLocIdArray = locIdsObj => Underpass
	.findAll({
		where: {
			[Sequelize.Op.or]: [{
				[Sequelize.Op.or]: locIdsObj.userLocIds1
			}, {
				[Sequelize.Op.or]: locIdsObj.userLocIds2
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

Underpass.findAllForLocId = locId => Underpass.findAll({
	where: {
		[Sequelize.Op.or]: [{
			loc_id_1: locId
		}, {
			loc_id_2: locId
		}]
	}
});

// Underpass.getAvailableLocIdsForUser = (locFromId, userId) => {
// 	const allowedIds = [];
// 	const prohibitedIds = [];
// 	let bounds;
// 	let excludeBounds;
// 	return Location.findById(locFromId)
// 		.then((location) => {
// 			bounds = Underpass.calcPermittedBoundsForLocation(location, 5);
// 			excludeBounds = Underpass.calcPermittedBoundsForLocation(location, 1);

// 			return Underpass.findAllForLocId(locFromId);
// 		})
// 		.then((underpasses) => {
// 			const excludedIds = [];
// 			excludedIds.push(locFromId);
// 			underpasses.forEach((item) => {
// 				const id1 = item.dataValues.loc_id_1;
// 				const id2 = item.dataValues.loc_id_2;
// 				excludedIds.push(id1);
// 				excludedIds.push(id2);
// 			});

// 			return Location.findAllUsersLocIdsWithinRectangle(bounds, userId, excludedIds);
// 		})
// 		.then((data) => {
// 			data.forEach((item) => {
// 				allowedIds.push(item.dataValues.id);
// 			});
// 			return Location.findAllUsersLocIdsWithinRectangle(excludeBounds, userId);
// 		})
// 		.then((data) => {
// 			data.forEach((item) => {
// 				prohibitedIds.push(item.dataValues.id);
// 			});

// 			return allowedIds.filter((item) => {
// 				if (!prohibitedIds.length) return item;
// 				for (let i = 0, max = prohibitedIds.length; i < max; i += 1) {
// 					if (item === prohibitedIds[i]) {
// 						prohibitedIds.splice(i, 1);
// 						return false;
// 					}
// 				}
// 				return item;
// 			});
// 		});
// };

// Underpass.calcPermittedBoundsForLocation = (location, index) => {
// 	const locGridObject = new EmptyLocationObject({
// 		lat: +location.dataValues.lat,
// 		lng: +location.dataValues.lng
// 	});

// 	const relLatSize = EmptyLocationObject.relLatSize / 10000000;
// 	const relLngSize = locGridObject.relLngSize / 10000000;

// 	return {
// 		north: locGridObject.northWest.lat + (relLatSize * index),
// 		south: locGridObject.northWest.lat - (relLatSize * index),
// 		east: locGridObject.northWest.lng + (relLngSize * index),
// 		west: locGridObject.northWest.lng - (relLngSize * index)
// 	};
// };

// Underpass.calcUnderpassDistanceByLocIds = (locationIdFrom, locationIdTo) => {
// 	let locationFrom;
// 	let locationTo;
// 	return Location.findById(locationIdFrom)
// 		.then((foundLocationFrom) => {
// 			locationFrom = new EmptyLocationObject({
// 				lat: +foundLocationFrom.dataValues.lat,
// 				lng: +foundLocationFrom.dataValues.lng
// 			});

// 			return Location.findById(locationIdTo);
// 		})
// 		.then((foundLocationTo) => {
// 			locationTo = new EmptyLocationObject({
// 				lat: +foundLocationTo.dataValues.lat,
// 				lng: +foundLocationTo.dataValues.lng
// 			});

// 			return Underpass.calcUnderpassDistance(
// 				locationFrom,
// 				locationTo
// 			);
// 		});
// };

// Underpass.calcUnderpassDistance = (locationFrom, locationTo) => {
// 	let lngDistance = Math.round((locationFrom.northWest.lng - locationTo.northWest.lng)
// 			/ (locationFrom.relLngSize / 10000000));
// 	let latDistance = Math.round((locationFrom.northWest.lat - locationTo.northWest.lat)
// 			/ (EmptyLocationObject.relLatSize / 10000000));

// 	lngDistance = lngDistance < 0 ? -lngDistance : lngDistance;
// 	latDistance = latDistance < 0 ? -latDistance : latDistance;

// 	return {
// 		distanceLat: latDistance,
// 		distanceLng: lngDistance
// 	};
// };

Location.belongsToMany(Location, {
	as: 'underpassTo',
	through: Underpass,
	foreignKey: {
		name: 'loc_id_2',
		primaryKey: true
	}
});
Location.belongsToMany(Location, {
	as: 'underpassFrom',
	through: Underpass,
	foreignKey: {
		name: 'loc_id_1',
		primaryKey: true
	}
});
Underpass.belongsTo(Location, {
	as: 'underpassTo',
	targetKey: 'id',
	foreignKey: 'loc_id_2'
});
Underpass.belongsTo(Location, {
	as: 'underpassFrom',
	targetKey: 'id',
	foreignKey: 'loc_id_1'
});

module.exports = Underpass;
