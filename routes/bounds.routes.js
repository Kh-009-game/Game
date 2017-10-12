const express = require('express');
const boundsController = require('../controllers/bounds-controller');
const lifecycleMiddleware = require('../middleware/lifecycle-middleware');

const router = express.Router();

router.use(lifecycleMiddleware.checkLifecycle);
router.get('/', boundsController.getGameBounds);

module.exports = router;
