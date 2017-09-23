const LocationService = require('../services/location-service');
const svgTemplate = require('../views/svg-tmpl');

module.exports.getAllLocations = (req, res, next) => {
	LocationService.getAllClientLocationObjectsForUser(req.decoded.userId)
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
	LocationService.occupyLocationByUser(req.decoded.userId, req.body)
		.then(() => {
			res.sendStatus(200);
			// emit update event in service
		})
		.catch(err => next(err));
};

// '/check-location?lat=xxx&lng=xxx'
module.exports.getLocationOnPoint = (req, res, next) => {
	LocationService.getLocationOnPointForUser(
		req.decoded.userId, {
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

module.exports.getLocationById = (req, res) => {
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

module.exports.editLocationById = (req, res, next) => {
	LocationService.editLocationById(req.body)
		.then(() => {
			res.sendStatus(200);
			// emit update event in service
		})
		.catch((err) => {
			next(err);
		});
};

// '/:id/loc-info?current=xxx&highlighted=xxx'
module.exports.getLocationInfoById = (req, res) => {
	req.body.requestedLocation = req.query.highlighted;
	req.body.requestedLocation = req.query.current;
	res.render('loc-info', {
		location: req.reqLocation,
		isAdmin: req.decoded.isAdmin
	});
};

module.exports.deleteLocationInfoById = (req, res, next) => {
	LocationService.deleteLocationById(req.params.locationId)
		.then(() => {
			res.sendStatus(200);
			// emit update event in service
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.doCheckin = (req, res, next) => {
	LocationService.doCheckinById(req.params.locationId)
		.then(() => {
			res.sendStatus(200);
			// emit change
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.takeDailyBank = (req, res, next) => {
	LocationService.takeDailyBankById(req.params.locationId)
		.then(() => {
			res.sendStatus(200);
			// emit change
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.restoreLoyalty = (req, res, next) => {
	LocationService.restoreLoyaltyById(req.params.locationId)
		.then(() => {
			res.sendStatus(200);
			// emit change
		})
		.catch((err) => {
			next(err);
		});
};
