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

	static findUser(email) {
		return User.findPerson(email);
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
