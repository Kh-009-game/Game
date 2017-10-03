const sequelize = require('./db-service-orm');
const Location = require('../models/location-orm');
const Underpass = require('../models/underpass');
// const LogMessage = require('../models/logMessage');
const User = require('../models/user-orm');

Location.User = Location.belongsTo(User);
User.Locations = User.hasMany(Location);

Location.belongsToMany(Location, {
	as: 'UnderpassTo',
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
			.then(location2 => sequelize.transaction(trans => Underpass.create({
				location_id: location.dataValues.id,
				underpass_id: location2.dataValues.id,
				distance: 2
			}, {
				transaction: trans
			})
				.then(() => Underpass.create({
					location_id: location2.dataValues.id,
					underpass_id: location.dataValues.id,
					distance: 2
				}, {
					transaction: trans
				}))
			))
		))
	.then(() => Location.findAll({
		include: [{
			model: User
		}, {
			model: Location,
			as: 'UnderpassTo'
		}],
		where: {
			user_id: 1
		}
	}))
	.then((location) => {
		console.dir(location[0].UnderpassTo);
	});
// Location.create({
//   lat: 49.995, 
//   lng: 36.24192,
//   name: 
// })
module.exports = sequelize;
