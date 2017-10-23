const UserService = require('../services/user-service');
// const jwt = require('jsonwebtoken');
const HttpError = require('../services/utils/http-error');

module.exports.getLoginForm = (req, res) => {
	res.render('login');
};
module.exports.loginUser = (req, res) => {
	const email = req.body['log-email'];
	const pass = req.body['log-pass'];
	UserService.findUser(email, pass)
		.then((token) => {
			res.cookie('auth', token);
			res.redirect('../');
		})
		.catch((err) => {
			res.send(new HttpError(401, HttpError.messages.unautorized));
			res.redirect('/login');
		});
};

module.exports.createUser = (req, res) => {
	const userData = {
		name: req.body['reg-name'],
		email: req.body['reg-email'],
		password: req.body['reg-pass'],
		passCheck: req.body['reg-pass-repeat']
	};
	if (userData.password !== userData.passCheck) {
		res.send('Passwords didn\'t match.');
	} else {
		UserService.createNewUser(userData)
			.then(() => {
				console.log('New user was added to db');
				UserService.sendLetter(userData.email);
			}).catch((error) => {
				console.log('error:', error);
			});
		res.redirect('../');
	}
};

module.exports.logOut = (req, res) => {
	res.clearCookie('auth');
	res.redirect('/login');
};
