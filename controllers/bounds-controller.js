const BoundsService = require('../services/fieldBounds-service');
const config = require('../config.json');

// gameBounds
module.exports.getGameBounds = (req, res, next) => {
	BoundsService.getGameBoundsPolygon(config.boundsId)
		.then((points) => {
			res.json(points);
		})
		.catch(err => next(err));
};
