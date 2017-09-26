const ClientLocationObject = require('../services/location-service');

module.exports.checkIsCurrent = (req, res, next) => {
	ClientLocationObject.checkIsCurrentPermission(
		req.body.locationData.northWest,
		req.body.userGeoData,
		req.decoded.isAdmin
	);
	next();
};

module.exports.checkDailyBank = (req, res, next) => {
	const locationId = req.params.id;
	const userId = req.decoded.id;
	ClientLocationObject.checkDailyBankPresenceAndPermission(
		locationId,
		req.body.userGeoData,
		userId,
		req.decoded.isAdmin
	)
		.then(() => {
			next();
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.checkOwner = (req, res, next) => {
	const locationId = req.params.id;
	const userId = req.decoded.id;
	ClientLocationObject.checkOwnerOrAdminPermission(
		locationId,
		userId,
		req.decoded.isAdmin
	)
		.then(() => {
			next();
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.checkOwnerAndIsCurrent = (req, res, next) => {
	const locationId = req.params.id;
	const userId = req.decoded.id;
	ClientLocationObject.checkIsCurrentAndOwnerOrAdminPermission(
		locationId,
		req.body.userGeoData,
		userId,
		req.decoded.isAdmin
	)
		.then(() => {
			next();
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.attachClientLocObject = (req, res, next) => {
	const locationId = req.params.id;
	const userId = req.decoded.id;
	ClientLocationObject.createClientLocationObjectByIdForUser(
		locationId,
		userId
	)
		.then((location) => {
			req.body.requestedLocation = location;
			next();
		})
		.catch((err) => {
			next(err);
		});
};
