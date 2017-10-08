const ClientLocationObject = require('../services/location-service');

module.exports.checkOwner = (req, res, next) => {
	const locationId = +req.query.locFromId;
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

module.exports.attachClientLocObject = (req, res, next) => {
	const locationId = +req.query.locFromId;
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
