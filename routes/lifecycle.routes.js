const LifeCycleController = require('../controllers/lifecycle-controller');
const authorizationMiddleware = require('../middleware/authorization-middleware');
const lifecycleMiddleware = require('../middleware/lifecycle-middleware');
const express = require('express');

const router = express.Router();

router.put(
	'/emit',
	lifecycleMiddleware.isLifecycle,
	authorizationMiddleware.isAdmin,
	LifeCycleController.emitLifecycle
);

module.exports = router;
