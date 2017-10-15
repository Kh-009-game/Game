const express = require('express');
const userController = require('../controllers/user-controller');

const router = express.Router();

router.get(
	'/login',
	userController.getLoginForm
);
router.post(
	'/login',
	userController.loginUser
);
router.post(
	'/register',
	userController.createUser
);
router.get(
	'/logout',
	userController.logOut
);

module.exports = router;
