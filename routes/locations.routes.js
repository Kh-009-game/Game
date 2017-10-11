const express = require('express');
const locationController = require('../controllers/location-controller');
const locationMiddlewares = require('../middleware/location-middlewares');
const lifecycleMiddleware = require('../middleware/lifecycle-middleware');

const router = express.Router();

router.use(lifecycleMiddleware.checkLifecycle);
router.get(
	'/',
	locationController.getAllLocations
);
router.get(
	'/create',
	locationController.getOccupyForm
);
router.post(
	'/create',
	locationMiddlewares.checkIsCurrent,
	locationController.occupyLocation
);
router.get(
	'/check-location',
	locationController.getLocationOnPoint
);
router.get(
	'/:id',
	locationMiddlewares.attachClientLocObject,
	locationController.getLocation
);
router.get(
	'/:id/svg',
	locationMiddlewares.attachClientLocObject,
	locationController.getLocationGraphic
);
router.get(
	'/:id/edit',
	locationMiddlewares.attachClientLocObject,
	locationController.getEditForm
);
router.put(
	'/:id',
	locationMiddlewares.checkOwner,
	locationController.editLocation
);
// '/:id/loc-info?current=xxx&highlighted=xxx'
router.get(
	'/:id/loc-info',
	locationMiddlewares.attachClientLocObject,
	locationController.getLocationInfo
);
router.delete(
	'/:id',
	locationMiddlewares.checkOwner,
	locationController.deleteLocation
);
router.put(
	'/:id/do-checkin',
	locationMiddlewares.checkOwnerAndIsCurrent,
	locationController.doCheckin
);
router.put(
	'/:id/get-bank',
	locationMiddlewares.checkDailyBank,
	locationController.takeDailyBank
);
router.put(
	'/:id/restore-population',
	locationMiddlewares.checkOwner,
	locationController.restoreLoyalty
);
module.exports = router;
