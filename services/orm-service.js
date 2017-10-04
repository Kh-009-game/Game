const sequelize = require('./db-service-orm');
const Location = require('../models/location-orm');
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

module.exports = sequelize;
