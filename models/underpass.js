const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');
const Location = require('./location-orm');

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
	loc_id_2: {
		type: Sequelize.INTEGER,
		allowNull: false
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

Underpass.findAllForByLocIdArray = locIdsObj => Underpass.findAll({
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

Underpass.getLocIdsAvailableInBounds = (locId, userId, bounds) => {
	const excludedIds = [];
	return Underpass.findAllForLocId(locId)
		.then((underpasses) => {
			excludedIds.push(locId);
			underpasses.forEach((item) => {
				const id1 = item.dataValues.loc_id_1;
				const id2 = item.dataValues.loc_id_2;
				excludedIds.push(id1);
				excludedIds.push(id2);
			});

			if (!bounds.excludedBounds) {
				return Promise.resolve();
			}

			return Location.findUdersLocIdsInRectangleByLocId(bounds.excludedBounds, userId);
		})
		.then((data) => {
			data.forEach((item) => {
				excludedIds.push(item.dataValues.id);
			});
			return Location.findUdersLocIdsInRectangleByLocId(bounds.includedBounds, userId, excludedIds);
		});
};

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
