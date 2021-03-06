'use strict';

class Conf {
	constructor() {
		this.calculatedBounds = [];
	}
	static get dbUsername() {
		return process.env.SERVICE_DB_USER;
	}

	static get dbPassword() {
		return process.env.SERVICE_DB_PASS;
	}

	static get restrictOccupyingSettings() {
		return {
			northWest: {
				lat: 50.067,
				lng: 36.12672
			},
			distance: {
				lat: 0.1692,
				lng: 0.3000
			}
		};
	}
	static get email() {
		return process.env.SERVICE_EMAIL;
	}
	static get emailPass() {
		return process.env.SERVICE_EMAIL_PASS;
	}

	static get gameBounds() {
		// return [
		// 	{ lat: 49.850, lng: 36.118 },
		// 	{ lat: 49.900, lng: 36.125 },
		// 	{ lat: 49.970, lng: 36.140 },
		// 	{ lat: 49.999, lng: 36.178 },
		// 	{ lat: 50.050, lng: 36.190 },
		// 	{ lat: 50.100, lng: 36.400 },
		// 	{ lat: 49.970, lng: 36.360 },
		// 	{ lat: 49.900, lng: 36.300 },
		// 	{ lat: 49.850, lng: 36.220 }
		// ];
		return [
			{ lat: 49.857, lng: 36.269 },
			{ lat: 49.885, lng: 36.168 },
			{ lat: 49.948, lng: 36.107 },
			{ lat: 50.043, lng: 36.107 },
			{ lat: 50.090, lng: 36.168 },
			{ lat: 50.113, lng: 36.269 },
			{ lat: 50.090, lng: 36.392 },
			{ lat: 50.043, lng: 36.357 },
			{ lat: 49.948, lng: 36.357 },
			{ lat: 49.885, lng: 36.392 }
		];
	}

	static set calculatedBounds(value) {
		this.calculatedBounds = value;
	}
	static get calculatedBounds() {
		return this.calculatedBounds;
	}
}

module.exports = Conf;
