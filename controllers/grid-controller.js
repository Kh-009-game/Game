const GridService = require('../services/grid-service');

module.exports.getGridByCoords = (req, res) => {
	const geoData = {
		lat: +req.query.lat,
		lng: +req.query.lng
	};
	const isAllowed = !!req.query.isAllowed;
	const location = GridService.createLocationByPoint(geoData, isAllowed);
	res.json(location);
};

module.exports.getLocInfo = (req, res) => {
	const isAllowed = !!req.query.isAllowed;
	const emptyLoc = new GridService({
		lat: req.query.lat,
		lng: req.query.lng
	}, isAllowed);
	emptyLoc.isHighlighted = !!req.query.highlighted;
	emptyLoc.isCurrent = !!req.query.current;
	res.render('loc-info', {
		location: emptyLoc,
		isAdmin: req.decoded.isAdmin
	});
};
