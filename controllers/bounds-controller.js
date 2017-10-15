const BoundsService = require('../services/fieldBounds-service');

// gameBounds
module.exports.getGameBounds = (req, res, next) => {
	BoundsService.getGameBounds(1)
		.then((points) => {
			res.json(points);
		})
		.catch(err => next(err));
};
