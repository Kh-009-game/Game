const User = require('../models/user-orm');

class UserObject {
	constructor(userData) {
		this.name = userData.name;
		this.cash = 150;
	}

	static createUser(name, email, pass, passCheck) {
		if (pass !== passCheck) {
			throw new Error('Passwords didn\'t match.');
		}
	}
}
