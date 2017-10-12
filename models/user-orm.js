const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');

const User = sequelize.define('user', {
	name: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false,
		validate: {
			isAlphanumeric: true
		}
	},
	email: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false,
		validate: {
			isEmail: true
		}
	},
	password: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			isAlphanumeric: true
		}
	},
	cash: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 150,
		validate: {
			min: 0
		}
	},
	is_admin: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
}, {
	underscored: true
});

User.giveCashById = (userId, cash, trans) => User.update({
	cash: sequelize.literal(`cash + ${cash}`)
}, {
	where: {
		id: userId
	},
	transaction: trans
});

User.takeCashById = (userId, cash, trans) => User.update({
	cash: sequelize.literal(`cash - ${cash}`)
}, {
	where: {
		id: userId
	},
	transaction: trans
});

module.exports = User;
