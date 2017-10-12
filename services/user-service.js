const User = require('../models/user-orm');
const Letter = require('../services/mail-service');

class UserObject {
	constructor(userData) {
		this.name = userData.name;
		this.cash = 150;
	}

	static createNewUser(userData) {
		// if (userData.password !== userData.passCheck) {
		// 	throw new Error('Passwords didn\'t match.'); убрать
		// } в контроллер

		return User.makeUser(userData)
			.then(() => console.log('New user was added to db'))
			.catch(error => console.log('error:', error));
	}

	static sendLetter(email) {
		const letter = Letter.createLetter(email);
		Letter.sendMail(letter);
	}
}

module.exports = UserObject;
