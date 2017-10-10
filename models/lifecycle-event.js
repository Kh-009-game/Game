const Sequelize = require('sequelize');
const sequelize = require('../services/db-service-orm');

const LifeCycleEvent = sequelize.define('lifecycle', {
	updated_at: {
		type: Sequelize.DATE,
		unique: true,
		allowNull: false,
		defaultValue: Sequelize.NOW
	}
}, {
	underscored: true
});

LifeCycleEvent.updateByTransLifecycleAndReturn = () => {
	let LifeCycleEventDate;

	return LifeCycleEvent.findById(1)
		.then((data) => {
			LifeCycleEventDate = data.dataValues.updated_at;

			return LifeCycleEvent.update({
				updated_at: Sequelize.NOW
			}, {
				where: {
					id: 1
				}
			});
		})
		.then(() => LifeCycleEventDate);
};

LifeCycleEvent.createIfNone = () => LifeCycleEvent.findById(1)
	.then((data) => {
		if (!data) {
			return LifeCycleEvent.create({});
		}
		return Promise.resolve();
	});

module.exports = LifeCycleEvent;
