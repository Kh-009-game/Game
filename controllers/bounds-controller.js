const boundsService = require('../services/bounds-service');

// gameBounds
module.exports.getGameBounds = (req, res, next) => {
	boundsService.getGameBounds()
		.then((points) => {
			res.json(points);
		})
		.catch(err => next(err));
	// res.json(boundsService.getGameBounds());
};
