const express = require('express');
const underpassesController = require('../controllers/underpasses-controller');
const underpassMiddlewares = require('../middleware/underpass-middlewares');

const router = express.Router();

router.get(
	'/',
	underpassesController.getAllUnderpasses
);
router.get(
	'/available-locations',
	underpassMiddlewares.checkOwner,
	underpassesController.getAvailableForConnectionLocIds
);
router.get(
	'/create',
	underpassMiddlewares.checkOwner,
	underpassMiddlewares.attachClientLocObject,
	underpassesController.getUnderpassCreationForm
);
router.post(
	'/create',
	underpassMiddlewares.checkOwnerAndIsCurrent,
	underpassesController.createUnderpass
);

module.exports = router;
