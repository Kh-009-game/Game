const express = require('express');
const locationController = require('../controllers/location-controller');
// const locationMiddlewares = require('../middleware/location-middlewares');

const router = express.Router();

router.get('/', locationController.calcGameBounds);
