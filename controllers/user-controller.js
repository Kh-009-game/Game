const UserService = require('../services/user-service');
// const jwt = require('jsonwebtoken');
const HttpError = require('../services/utils/http-error');
const fs = require('fs');

module.exports.getLoginForm = (req, res) => {
	//res.render('login');
	
	fs.readFile('../text.txt', (err, data) => res.json(data));
};
module.exports.loginUser = (req, res, next) => {
	const email = req.body['log-email'];
	const pass = req.body['log-pass'];
	UserService.findUser(email, pass)
		.then((token) => {
			res.cookie('auth', token);
			res.redirect('../');
		})
		.catch((err) => {
			next(new HttpError(401, HttpError.messages.unautorized));
			res.redirect('/login');
		});
};

module.exports.getIndexPage = (req, res, next) => {
	const userId = req.decoded.id;
	UserService.createUserObjectById(userId)
		.then((userData) => {
			console.log('result', userData);
			res.render('index', userData);
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.createUser = (req, res, next) => {
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
			}).catch((err) => {
				next(err);
			});
		res.redirect('../');
	}
};

module.exports.getUserCashById = (req, res, next) => {
	const userId = req.decoded.id;
	UserService.getUserCashById(userId)
		.then((cash) => {
			res.json({ cash });
		})
		.catch((err) => {
			next(err);
		});
};

module.exports.logOut = (req, res) => {
	res.clearCookie('auth');
	res.redirect('/login');
};
