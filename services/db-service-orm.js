const Sequelize = require('sequelize');
const config = require('../config.json');

const database = config.dbNmme;
const user = process.env[config.dbUser];
const password = process.env[config.dbPass];
const host = config.dbHost;

const port = 5432;
const sequelize = new Sequelize(database, user, password, {
	host,
	port,
	dialect: 'postgres',
	dialectOptions: {
		ssl: true,
		sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
	},
	pool: {
		max: 20,
		min: 0,
		idle: 10000
	},
	logging: false
});

module.exports = sequelize;
