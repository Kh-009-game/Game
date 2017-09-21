const sequelize = require('./db-service-orm');
const Location = require('../models/location-orm');
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
	.then(() => {

	});

// Location.sync()
// 	.then(() => {
// 		Location.create({
// 			lat: 50.002,
// 			lng: 60.003,
// 			name: 'Merry ABC',
// 			daily_msg: 'Hi-ish'
// 		});
// 	});
