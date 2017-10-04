const express = require('express');
const boundsController = require('../controllers/bounds-controller');
// const locationMiddlewares = require('../middleware/location-middlewares');

const router = express.Router();

router.get('/', boundsController.getGameBounds);

module.exports = router;
