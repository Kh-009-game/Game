const sequelize = require('./db-service-orm');
const Sequelize = require('sequelize');
const Location = require('../models/location-orm');
// const LogMessage = require('../models/logMessage');
const User = require('../models/user-orm');

const Underpass = sequelize.define('underpass', {
// 	location_id: {
// 		type: Sequelize.INTEGER,
// 		primaryKey: 'underpass'
// 	},
// 	underpass_id: {
// 		type: Sequelize.INTEGER,
// 		primaryKey: 'underpass'
// 	}
}, {
	underscored: true
});


Location.User = Location.belongsTo(User);
User.Locations = User.hasMany(Location);
Location.belongsToMany(Location, {
	as: 'UnderpassTo',
	// foreignKey: 'underpass_id',
	foreignKey: {
		name: 'underpass_id',
		primaryKey: true
	},
	through: 'underpass',
	unique: '123'
});
Location.belongsToMany(Location, {
	as: 'UnderpassFrom',
	through: 'underpass',
	foreignKey: {
		name: 'location_id',
		primaryKey: true
	}
});
// Underpass.belongsTo(Location, {
// 	primaryKey: true
// });
// Location.belongsToMany(Location, {
// 	as: 'Underpass',
// 	foreignKey: 'location_id',
// 	// through: Underpass
// });

// Underpass.sync({ force: true });

Location.sync({ force: true })
	.then(() => Underpass.sync({ force: true }))
	.then(() => Location.create({
		lat: 49.995,
		lng: 36.24192,
		name: '123',
		daily_msg: '123',
		user_id: '1'
	}))
	.then(() => Location.create({
		lat: 50.004,
		lng: 36.2432,
		name: '123',
		user_id: '1'
	}))
	.then(() => Location.findById(1)
		.then(location => Location.findById(2)
			.then((location2) => {
				location.addUnderpassTo([location2]);
				location2.addUnderpassTo([location]);
			})
		)
	)
	.then(() => Location.findById(1, {
		include: {
			model: Location,
			as: 'UnderpassTo'
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
