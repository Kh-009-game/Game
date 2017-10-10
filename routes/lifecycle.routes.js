const LifeCycleController = require('../controllers/lifecycle-controller');
const authorizationMiddleware = require('../middleware/authorization-middleware');
const express = require('express');

const router = express.Router();

router.put(
	'/emit',
	authorizationMiddleware.isAdmin,
	LifeCycleController.emitLifecycle
);

module.exports = router;
