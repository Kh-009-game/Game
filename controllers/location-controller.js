const LocationService = require('../services/location-service');
const svgTemplate = require('../views/svg-tmpl');
const boundService = require('../services/bounds-service');

module.exports.getAllLocations = (req, res, next) => {
	LocationService.getAllClientLocationObjectsForUser(req.decoded.id)
		.then((locations) => {
			res.json(locations);
		})
		.catch(err => next(err));
};

// '/create?clicked=true'
module.exports.getOccupyForm = (req, res) => {
	res.render('loc-form', {
		location: null,
		clicked: req.query.clicked,
		isAdmin: req.decoded.isAdmin
	});
};

module.exports.occupyLocation = (req, res, next) => {
	LocationService.occupyLocationByUser(req.decoded.id, req.body.locationData)
		.then(() => {
			res.sendStatus(200);
		})
		.catch(err => next(err));
};

// gameBounds
module.exports.getGameBounds = (req, res) => {
	const bounds = boundService.getGameBounds();
	res.json(bounds);
};
// '/check-location?lat=xxx&lng=xxx'
module.exports.getLocationOnPoint = (req, res, next) => {
	LocationService.getLocationOnPointForUser(
		req.decoded.id, {
			lat: +req.query.lat,
			lng: +req.query.lng
		})
		.then((locationObj) => {
			res.json(locationObj);
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.getLocation = (req, res) => {
	res.json(req.body.requestedLocation);
};

module.exports.getLocationGraphic = (req, res) => {
	res.set('Content-Type', 'image/svg+xml')
		.send(
			svgTemplate(req.body.requestedLocation)
		);
};

module.exports.getEditForm = (req, res) => {
	res.render('loc-form', {
		location: req.body.requestedLocation,
		clicked: true,
		isAdmin: req.decoded.isAdmin
	});
};

module.exports.editLocation = (req, res, next) => {
	LocationService.editLocationById(req.body)
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
};

// '/:id/loc-info?current=xxx&highlighted=xxx'
module.exports.getLocationInfo = (req, res) => {
	const reqLocation = req.body.requestedLocation;
	reqLocation.isHighlighted = req.query.highlighted;
	reqLocation.isCurrent = req.query.current;
	res.render('loc-info', {
		location: reqLocation,
		isAdmin: req.decoded.isAdmin
	});
};

module.exports.deleteLocation = (req, res, next) => {
	LocationService.deleteLocationById(req.params.id)
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.doCheckin = (req, res, next) => {
	LocationService.doCheckinById(req.params.id)
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.takeDailyBank = (req, res, next) => {
	LocationService.takeDailyBankById(req.params.id)
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.restoreLoyalty = (req, res, next) => {
	LocationService.restoreLoyalPopulationByUser(
		req.params.id,
		req.decoded.id
	)
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
};

