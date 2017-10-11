const db = require('../services/db-transport');

class User {
	constructor(userData) {
		this.name = userData.name;
		this.email = userData.email;
		this.pass = userData.pass;
		this.registrationDate = new Date().toISOString();
		this.cash = 150;
		this.isAdmin = userData.isAdmin || false;
	}

	saveNewUser() {
		db.none('insert into users(email, password, created_at, updated_at, cash, name, is_admin)' +
		`values('${this.email}', '${this.pass}', '${this.registrationDate}', '${this.registrationDate}', '${this.cash}', '${this.name}', ${this.isAdmin})`)
			.then(() => console.log('New user was added to db'))
			.catch(error => console.log('error:', error));
	}

	createLetter() {
		return {
			from: '"Game team" <gamekh009@gmail.com>', // sender address
			to: this.email, // receivers
			subject: 'Hello! new user! ✔', // Subject line
			text: 'Hello! We are glad that you joined our game', // plain text body
			html: '<b>Hello! We are glad that you joined our game!</b>' // html body
		};
	}

	sendMail(letter, transporter) {
		transporter.sendMail(letter, (error, info) => {
			if (error) {
				console.log(`error !!! ${error.message}`);
			} else {
				console.log(`Email sent: ${info.response}`);
			}
		});
	}
}
module.exports = User;
