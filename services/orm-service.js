const sequelize = require('./db-service-orm');
const Location = require('../models/location-orm');
// const LogMessage = require('../models/logMessage');
const User = require('../models/user-orm');

Location.User = Location.belongsTo(User);
User.Locations = User.hasMany(Location);
module.exports = sequelize;
