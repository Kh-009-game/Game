const User = require('../models/user-orm');
const Letter = require('../services/mail-service');
const jwt = require('jsonwebtoken');

class UserObject {
	constructor(userData) {
		this.name = userData.name;
		this.cash = 150;
	}

	static createNewUser(userData) {
		return User.makeUser(userData);
	}

	static sendLetter(email) {
		const letter = Letter.createLetter(email);
		Letter.sendMail(letter);
	}

	static findUser(email, password) {
		return User.findPerson(email)
			.then((data) => {
				if (data.dataValues.password === password) {
					const payload = {
						id: data.dataValues.id,
						email: data.dataValues.email,
						name: data.dataValues.name,
						isAdmin: data.dataValues.is_admin
					};
					const token = jwt.sign(payload, 'secret', {
						expiresIn: 86400
					});
					return token;
				}
			})
			.catch((err) => {
				return err;
			});
	}

	static verifyToken(token) {
		return new Promise((resolve, reject) => {
			jwt.verify(token.auth, 'secret', (err, decoded) => {
				if (err) {
					reject(err);
				}
				resolve(decoded);
			});
		});
	}
}

module.exports = UserObject;
