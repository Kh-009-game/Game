const ClientLocationObject = require('./location-service.js');

class ClientClusterObject extends ClientLocationObject {
	constructor(location, userId) {
		super(location, userId);

		const locationData = location.dataValues;
		const underpassesTo = [];

		if (Array.isArray(locationData.UnderpassTo)) {
			locationData.UnderpassTo.forEach((item) => {
				underpassesTo.push(item.dataValues.id);
			});
			locationData.UnderpassFrom.forEach((item) => {
				underpassesTo.push(item.dataValues.id);
			});
		}

		this.underpassesTo = underpassesTo;
	}
}

module.exports = ClientClusterObject;
