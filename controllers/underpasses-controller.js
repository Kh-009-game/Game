const UnderpassClientObject = require('../services/underpass-service');

module.exports.getAllUnderpasses = (req, res, next) => {
	const userId = req.decoded.id;
	UnderpassClientObject.getAllUnderpassesForUser(userId)
		.then((underpasses) => {
			res.json(underpasses);
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.createUnderpass = (req, res, next) => {
	const locFromId = req.body.locIdFrom;
	const locToId = req.body.locIdTo;
	UnderpassClientObject.createUnderpass(locFromId, locToId)
		.then(() => {
			res.send(200);
		})
		.catch((err) => {
			next(err);
		});
};
// /available-locations?locFromId=xxx
module.exports.getAvailableForConnectionLocIds = (req, res, next) => {
	const locFromId = +req.query.locFromId;
	const userId = req.decoded.id;
	UnderpassClientObject.getAvailableLocIdsForUser(locFromId, userId)
		.then((availableLocIds) => {
			res.json(availableLocIds);
		})
		.catch((err) => {
			next(err);
		});
};
// getUnderpassCreationFrom
module.exports.getUnderpassCreationForm = (req, res) => {
	res.render('underpass-form', {
		location: req.body.requestedLocation
	});
};
