const LifeCycleService = require('../services/lifecycle-service');

module.exports.emitLifecycle = (req, res, next) => {
	LifeCycleService.emitLifecycle()
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
};
