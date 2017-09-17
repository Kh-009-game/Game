const pgp = require('pg-promise')();
const config = require('../config');

module.exports = pgp({
	host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
	port: 5432,
	database: 'detamp7dm7n5kt',
	user: process.env.SERVICE_DB_USER || config.dbUsername,
	password: process.env.SERVICE_DB_PASS || config.dbPassword,
	ssl: true,
	sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
});
