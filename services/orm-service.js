const Sequelize = require('sequelize');
const config = require('../config');

const database = 'detamp7dm7n5kt';
const user = process.env.SERVICE_DB_USER || config.dbUsername;
const password = process.env.SERVICE_DB_PASS || config.dbPassword;
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
	}
});

const User = sequelize.define('other_user', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		unique: true,
		allowNull: false,
		primaryKey: true
	},
	name: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false
	},
	email: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false
	},
	password: {
		type: Sequelize.STRING,
		allowNull: false
	},
	cash: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 150
	},
	is_admin: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
});

// force: true will drop the table if it already exists
// User.sync({ force: true }).then(() =>
// 	// Table created
// 	User.create({
// 		name: 'John',
// 		email: '123123@123.com',
// 		password: '123'
// 	})
// );

module.exports = sequelize;
