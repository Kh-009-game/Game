const ClientLocationObject = require('../services/location-service');

module.exports.checkIsCurrent = (req, res, next) => {
	ClientLocationObject.checkIsCurrentPermission(
		req.locationData,
		req.userGeodata,
		req.decoded.isAdmin
	);
	next();
};

module.exports.checkDailyBank = (req, res, next) => {
	const locationId = req.params.id;
	const userId = req.decoded.id;
	ClientLocationObject.checkDailyBankPresenceAndPermission(
		locationId,
		req.userGeodata,
		userId,
		req.decoded.isAdmin
	)
		.then(() => {
			next();
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
		});
};

module.exports.checkOwnerAndIsCurrent = (req, res, next) => {
	const locationId = req.params.id;
	const userId = req.decoded.id;
	ClientLocationObject.checkIsCurrentAndOwnerOrAdminPermission(
		locationId,
		req.userGeodata,
		userId,
		req.decoded.isAdmin
	)
		.then(() => {
			next();
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
			req.reqLocation = location;
			next();
		});
};
