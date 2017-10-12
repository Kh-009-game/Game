const LifeCycleController = require('../controllers/lifecycle-controller');
const authorizationMiddleware = require('../middleware/authorization-middleware');
const lifecycleMiddleware = require('../middleware/lifecycle-middleware');
const express = require('express');

const router = express.Router();


router.use(lifecycleMiddleware.checkLifecycle);
router.put(
	'/emit',
	lifecycleMiddleware.checkLifecycle,
	authorizationMiddleware.isAdmin,
	LifeCycleController.emitLifecycle
);

module.exports = router;
