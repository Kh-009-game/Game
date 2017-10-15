const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');

const BoundPoint = sequelize.define('field_bound', {
	figure_id: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	point_order: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	lat: {
		type: Sequelize.DECIMAL,
		unique: 'coords',
		allowNull: false,
		validate: {
			min: -90,
			max: 90
		}
	},
	lng: {
		type: Sequelize.DECIMAL,
		unique: 'coords',
		allowNull: false,
		validate: {
			min: -180,
			max: 180
		}
	}
},
{
	timestamps: false
});

BoundPoint.getFigurePointsById = id => BoundPoint.findAll({
	where: {
		figure_id: id
	}
})
	.then((points) => {
		points.sort((pointA, pointB) => pointA.point_order - pointB.point_order);
		const pointsArray = [];
		points.forEach((point) => {
			pointsArray.push({
				lat: +point.dataValues.lat,
				lng: +point.dataValues.lng
			});
		});

		return pointsArray;
	});

module.exports = BoundPoint;
