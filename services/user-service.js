const User = require('../models/user-orm');

class UserObject {
	constructor(userData) {
		this.name = userData.name;
		this.cash = 150;
	}

	static createNewUser(userData) {
		// if (userData.password !== userData.passCheck) {
		// 	throw new Error('Passwords didn\'t match.');
		// }

		return User.makeUser(userData)
			.then(() => console.log('New user was added to db'))
			.catch(error => console.log('error:', error));
	}
}

module.exports = UserObject;
