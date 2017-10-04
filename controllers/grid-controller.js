const GridService = require('../services/grid-service');

module.exports.getGridByCoords = (req, res) => {
	const geoData = {
		lat: +req.query.lat,
		lng: +req.query.lng
	};
	// const locCoords = EmptyLocation.calcNorthWestByPoint(geoData);
	// const location = new EmptyLocation(locCoords);
	const location = GridService.createLocationByPoint(geoData);
	res.json(location);
};

module.exports.getLocInfo = (req, res) => {
	const emptyLoc = new GridService({
		lat: req.query.lat,
		lng: req.query.lng
	});
	emptyLoc.isHighlighted = req.query.highlighted;
	emptyLoc.isCurrent = req.query.current;
	res.render('loc-info', {
		location: emptyLoc,
		isAdmin: req.decoded.isAdmin
	});
};
