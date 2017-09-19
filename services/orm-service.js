const Sequelize = require('sequelize');
// const config = require('../config');

const database = 'dc4ro46n0d2omf';
const user = process.env.MY_DB_USER;
const password = process.env.MY_DB_PASS;
console.log(user, password);
const host = 'ec2-46-137-108-117.eu-west-1.compute.amazonaws.com';
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

// const User = sequelize.define('other_user', {
// 	id: {
// 		type: Sequelize.INTEGER,
// 		autoIncrement: true,
// 		unique: true,
// 		allowNull: false,
// 		primaryKey: true
// 	},
// 	name: {
// 		type: Sequelize.STRING,
// 		unique: true,
// 		allowNull: false
// 	},
// 	email: {
// 		type: Sequelize.STRING,
// 		unique: true,
// 		allowNull: false
// 	},
// 	password: {
// 		type: Sequelize.STRING,
// 		allowNull: false
// 	},
// 	cash: {
// 		type: Sequelize.INTEGER,
// 		allowNull: false,
// 		defaultValue: 150
// 	},
// 	is_admin: {
// 		type: Sequelize.BOOLEAN,
// 		allowNull: false,
// 		defaultValue: false
// 	}
// });

// User.sync({ force: true }).then(() =>
// 	User.create({
// 		name: 'John',
// 		email: '123123@123.com',
// 		password: '123'
// 	})
// );

module.exports = sequelize;
