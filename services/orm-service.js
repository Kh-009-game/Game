const Sequelize = require('sequelize');
const sequelize = require('./db-service-orm');
const Location = require('../models/location-orm');
const LogMessage = require('../models/logMessage');
const User = require('../models/user-orm');

Location.User = Location.belongsTo(User);
User.Locations = User.hasMany(Location);

User.sync({ force: true })
	.then(() => User.create({
		email: '123@re.re',
		name: 'Vasya',
		password: '123'
	}))
	.then(() => Location.sync({ force: true }))
	.then(() => Location.create({
		lat: 50.002,
		lng: 60.003,
		name: 'MerryABC',
		daily_msg: 'Hiish',
		user_id: 1
	}, {
		include: [User]
	}))
	.then(() => LogMessage.sync({ force: true }))
	.then(() => LogMessage.create({
		type: 'system',
		status: 'daily-event',
		message: 'OK'
	}))
	.then(() => Location.findById(1, {
		include: {
			model: User
		}
	}))
	.then(location => LogMessage.max('created_at', {
		where: {
			type: 'system',
			status: 'daily-event'
		}
	})
		.then((lastLifeCycleEventDate) => {
			location.dataValues.lastLifeCycleEventDate = lastLifeCycleEventDate;
			return location.getUser();
		})
		.then((user) => {
			location.dataValues.masterName = user.name;
			return location;
		})
	)
	.then((location) => {
		console.log(location);
		console.log(location.user);
	});
// .then(() => Location.update({
// 	checkin_date: new Date(),
// 	taking_bank_date: new Date()
// }, {
// 	where: {
// 		id: 1,
// 		user_id: 1
// 	}
// }));
