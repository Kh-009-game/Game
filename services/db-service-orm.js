const Sequelize = require('sequelize');

// const database = 'dc4ro46n0d2omf';
// const user = process.env.MY_DB_USER;
// const password = process.env.MY_DB_PASS;
// const host = 'ec2-46-137-108-117.eu-west-1.compute.amazonaws.com';

const database = 'detamp7dm7n5kt';
const user = process.env.SERVICE_DB_USER || 'smdtzebruscqxv';
const password = process.env.SERVICE_DB_PASS || 'b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd';
const host = 'ec2-23-21-85-76.compute-1.amazonaws.com';

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
