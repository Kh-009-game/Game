const HttpError = require('../services/utils/http-error');

module.exports.isAdmin = (req, res, next) => {
	if (!req.decoded.isAdmin) {
		next(new HttpError(403, HttpError.messages.isNotAdmin));
	}
	next();
};
