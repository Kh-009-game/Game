const LifeCycleService = require('../services/lifecycle-service');

module.exports.checkLifecycle = (req, res, next) => {
	LifeCycleService.checkDBRecalc();
	next();
};
