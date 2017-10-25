const express = require('express');
const userController = require('../controllers/user-controller');
const authMiddleware = require('../middleware/auth');

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

router.get(
	'/current-user-cash',
	authMiddleware.checkToken,
	userController.getUserCashById
);

module.exports = router;
