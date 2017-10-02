const express = require('express');
const underpassesController = require('../controllers/underpasses-controller');

const router = express.Router();

router.get(
	'/',
	underpassesController.getAllUnderpasses
);
router.post(
	'/create',
	underpassesController.createUnderpass
);
