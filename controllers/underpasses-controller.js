const UnderpassClientObject = require('../services/underpass-service');

module.exports.getAllUnderpasses = (req, res, next) => {
	UnderpassClientObject.getAllUnderpassesForUser()
		.then(() => {
			res.send(200);
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.createUnderpass = (req, res, next) => {
	UnderpassClientObject.createUnderpassByUser()
		.then(() => {
			res.send(200);
		})
		.catch((err) => {
			next(err);
		});
};
