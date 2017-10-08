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
	distance_lng: {
		type: Sequelize.DECIMAL,
		allowNull: false,
		validate: {
			max: 5,
			min: 1
		}
	},
	distance_lat: {
		type: Sequelize.DECIMAL,
		allowNull: false,
		validate: {
			max: 5,
			min: 1
		}
	}
}, {
	underscored: true
});

module.exports = Underpass;
