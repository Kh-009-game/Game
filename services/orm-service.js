const Sequelize = require('sequelize');
const sequelize = require('./db-service-orm');
const Location = require('../models/location-orm');
const LifeCycleEvent = require('../models/lifecycle-event');
const Underpass = require('../models/underpass');
const User = require('../models/user-orm');

Location.User = Location.belongsTo(User);
User.Locations = User.hasMany(Location);

Location.LifeCycleEvent = Location.belongsTo(LifeCycleEvent);
LifeCycleEvent.hasMany(Location);

Location.belongsToMany(Location, {
	as: 'underpassTo',
	through: Underpass,
	foreignKey: {
		name: 'loc_id_2',
		primaryKey: true
	}
});
Location.belongsToMany(Location, {
	as: 'underpassFrom',
	through: Underpass,
	foreignKey: {
		name: 'loc_id_1',
		primaryKey: true
	}
});
Underpass.belongsTo(Location, {
	as: 'underpassTo',
	targetKey: 'id',
	foreignKey: 'loc_id_2'
});
Underpass.belongsTo(Location, {
	as: 'underpassFrom',
	targetKey: 'id',
	foreignKey: 'loc_id_1'
});

module.exports = sequelize;
