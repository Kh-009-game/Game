const User = require('../models/user-orm');
const Letter = require('../services/mail-service');
const jwt = require('jsonwebtoken');

class UserObject {
	constructor(data) {
		this.name = data.dataValues.name;
		this.cash = data.dataValues.cash;
		this.isAdmin = data.dataValues.is_admin;
	}

	static createUserObjectById(id) {
		return User.findById(id)
			.then((data) => {
				console.log('obj', data);
				return new UserObject(data);
			});
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
			.catch(err => err);
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

	static getUserCashById(userId) {
		return User.getCashById(userId);
	}
}

module.exports = UserObject;
