const sequelize = require('./db-service-orm');
const Location = require('../models/location-orm');
// const LogMessage = require('../models/logMessage');
const User = require('../models/user-orm');

const Underpass = sequelize.define('underpass', {

}, {
	underscored: true
});


Location.User = Location.belongsTo(User);
User.Locations = User.hasMany(Location);
Underpass.belongsTo(Location);
Location.belongsToMany(Location, {
	as: 'Underpass',
	foreignKey: 'underpass_id',
	through: 'underpass'
});

Location.sync({ force: true })
	.then(() => Underpass.sync({ force: true }))
	.then(() => Location.create({
		lat: 49.995,
		lng: 36.24192,
		name: '123',
		daily_msg: '123'
	}))
	.then(() => Location.create({
		lat: 50.004,
		lng: 36.2432,
		name: '123',
		daily_msg: '123'
	}))
	.then(() => Location.findById(1)
		.then(location => Location.findById(2)
			.then((location2) => {
				location.addUnderpass([location2]);
				location2.addUnderpass([location]);
			})
		)
	)
	.then(() => Location.findById(1, {
		include: {
			model: Location,
			as: 'Underpass'
		}
	}))
	.then((location) => {
		console.dir(location);
	});
// Location.create({
//   lat: 49.995, 
//   lng: 36.24192,
//   name: 
// })
module.exports = sequelize;
