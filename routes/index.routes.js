const express = require('express');
const userController = require('../controllers/user-controller');

const router = express.Router();

router.get(
	'/',
	userController.getIndexPage
);


module.exports = router;
