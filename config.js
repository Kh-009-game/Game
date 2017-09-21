'use strict';

class Conf {
	static get dbUsername() {
		return 'smdtzebruscqxv';
	}

	static get dbPassword() {
		return 'b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd';
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
		return 'gamekh009@gmail.com';
	}
	static get emailPass() {
		return 'SoftServe';
	}

	static get gameBounds() {
		return [
			{ lat: 49.890, lng: 36.098 },
			{ lat: 50.112, lng: 36.249 },
			{ lat: 49.894, lng: 36.475 }
		];
	}
}

module.exports = Conf;
