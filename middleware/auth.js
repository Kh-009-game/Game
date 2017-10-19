const regexp = new RegExp(/^\/?api.*$/);
const UserService = require('../services/user-service');

module.exports.checkToken = (req, res, next) => {
	const token = req.cookies || req.body.token || req.query.token || req.headers['x-access-token'];
	if (req.url.match(regexp)) {
		if (token.auth) {
			UserService.verifyToken(token)
				.then((decoded) => {
					req.decoded = decoded;
					next();
				})
				.catch((err) => {
					res.status(403).send('Forbidden');
				});
		} else {
			res.status(401).send('UNAUTHORIZED');
		}
	}

	if (!req.url.match(regexp)) {
		if (token.auth) {
			UserService.verifyToken(token)
				.then((decoded) => {
					req.decoded = decoded;
					next();
				})
				.catch((err) => {
					res.redirect('/user/login');
				});
		} else {
			res.redirect('/user/login');
		}
	}
};
