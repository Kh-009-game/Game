const UserService = require('../services/user-service');
const jwt = require('jsonwebtoken');

module.exports.getLoginForm = (req, res) => {
	res.render('login');
};
module.exports.loginUser = (req, res) => {
	const email = req.body['log-email'];
	const password = req.body['log-pass'];
	UserService.findUser(email)
		.then((data) => {
			// console.log(data);
			if (data.password !== password) {
				res.redirect('/login');
			}
			if (data.password === password) {
			// create a token
				const payload = {
					id: data.id,
					email: data.email,
					name: data.name,
					isAdmin: data.is_admin
				};
				const token = jwt.sign(payload, 'secret', {
					expiresIn: 86400
				});
				res.cookie('auth', token);
				res.redirect('../');
			} else {
				res.redirect('/login');
			}
		}).catch((err) => {
			console.log(err);
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
