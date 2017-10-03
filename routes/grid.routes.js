const express = require('express');
const GridController = require('../controllers/grid-controller');

const router = express.Router();


router.get('/', GridController.getGridByCoords);

router.get('/loc-info', GridController.getLocInfo);


module.exports = router;
