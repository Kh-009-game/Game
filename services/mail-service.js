const nodemailer = require('nodemailer');
const Config = require('../config');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.SERVICE_EMAIL || Config.email,
		pass: process.env.SERVICE_EMAIL_PASS || Config.emailPass
	}
});

class Letter {
	static createLetter(email) {
		return {
			from: '"Game team" <gamekh009@gmail.com>', // sender address
			to: email, // receivers
			subject: 'Hello! new user! ✔', // Subject line
			text: 'Hello! We are glad that you joined our game on https://mice-lord.herokuapp.com/', // plain text body
			html: '<b>Hello! We are glad that you joined our game on https://mice-lord.herokuapp.com/!</b>' // html body
		};
	}

	static sendMail(letter) {
		transporter.sendMail(letter, (error, info) => {
			if (error) {
				console.log(`error !!! ${error.message}`);
			} else {
				console.log(`Email sent: ${info.response}`);
			}
		});
	}
}

module.exports = Letter;
