const Sequelize = require('sequelize');
const sequelize = require('./db-service-orm');
const Location = require('../models/location-orm');
const LifeCycleEvent = require('../models/lifecycle-event');
const Underpass = require('../models/underpass');
const User = require('../models/user-orm');


module.exports = sequelize;
