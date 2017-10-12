const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');

const BoundPoint = sequelize.define('field_bound', {
	figure_id: {
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
		const pointsArray = [];
		points.forEach((point) => {
			pointsArray.push({
				lat: +point.dataValues.lat,
				lng: +point.dataValues.lng
			});
		});

		return pointsArray;
	});


// BoundPoint.sync()
// 	.then(() => BoundPoint.create({
// 		figure_id: 1,
// 		lat: 49.88562,
// 		lng: 36.38594
// 	}))
// 	.then(() => BoundPoint.create({
// 		figure_id: 1,
// 		lat: 49.88612,
// 		lng: 36.38527
// 	}))
// 	.then(() => BoundPoint.create({
// 		figure_id: 1,
// 		lat: 50.105247,
// 		lng: 36.263049
// 	}))
// 	.then(() => BoundPoint.create({
// 		figure_id: 1,
// 		lat: 50.036626,
// 		lng: 36.125492
// 	}))
// 	.then(() => BoundPoint.create({
// 		figure_id: 1,
// 		lat: 49.881126,
// 		lng: 36.150734
//   }));

module.exports = BoundPoint;
