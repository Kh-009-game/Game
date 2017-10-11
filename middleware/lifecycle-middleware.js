const LifeCycleService = require('../services/lifecycle-service');

module.exports.checkLifecycle = (req, res, next) => {
	LifeCycleService.checkDBRecalc();
	next();
};

module.exports.isLifecycle = (req, res, next) => {
	req.body.isLifecycle = LifeCycleService.isLifecycle();
	next();
};
