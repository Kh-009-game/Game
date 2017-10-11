const LifeCycleService = require('../services/lifecycle-service');

module.exports.isLifecycle = (req, res, next) => {
	LifeCycleService.checkDBRecalc();
	next();
};
