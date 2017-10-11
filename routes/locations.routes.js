const express = require('express');
const locationController = require('../controllers/location-controller');
const locationMiddlewares = require('../middleware/location-middlewares');
const lifecycleMiddleware = require('../middleware/lifecycle-middleware');

const router = express.Router();

router.get(
	'/',
	locationController.getAllLocations
);
router.get(
	'/create',
	lifecycleMiddleware.isLifecycle,
	locationController.getOccupyForm
);
router.post(
	'/create',
	lifecycleMiddleware.isLifecycle,
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
	lifecycleMiddleware.isLifecycle,
	locationMiddlewares.attachClientLocObject,
	locationController.getEditForm
);
router.put(
	'/:id',
	lifecycleMiddleware.isLifecycle,
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
	lifecycleMiddleware.isLifecycle,
	locationMiddlewares.checkOwner,
	locationController.deleteLocation
);
router.put(
	'/:id/do-checkin',
	lifecycleMiddleware.isLifecycle,
	locationMiddlewares.checkOwnerAndIsCurrent,
	locationController.doCheckin
);
router.put(
	'/:id/get-bank',
	lifecycleMiddleware.isLifecycle,
	locationMiddlewares.checkDailyBank,
	locationController.takeDailyBank
);
router.put(
	'/:id/restore-population',
	lifecycleMiddleware.isLifecycle,
	locationMiddlewares.checkOwner,
	locationController.restoreLoyalty
);
module.exports = router;
