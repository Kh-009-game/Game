const UserService = require('../services/user-service');

module.exports.getLoginForm = (req, res) => {
	res.render('login');
};
// module.exports.loginUser = (req, res) => {
// 	const email = req.body['log-email'];
// 	const password = req.body['log-pass'];
// 	UserService.findUser(email, password);
// };
module.exports.createUser = (req, res) => {	
	const userData = {
		name: req.body['reg-name'],
		email: req.body['reg-email'],
		password: req.body['reg-pass'],
		passCheck: req.body['reg-pass-repeat']
	};
	console.log(userData);
	UserService.createNewUser(userData);
	res.redirect('../');
};

