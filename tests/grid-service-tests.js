const assert = require('assert');
const EmptyLocation = require('../services/grid-service');

describe('Grid service', () => {
	describe('Relative latitude location size calculation', () => {
		it('Result of dividing total latitude degrees is integer', () => {
			assert.equal(0, 1800000000 % EmptyLocation.calcRelLatSize());
		});
	});

	describe('Relative longitude location size calculation', () => {
		for (let lat = 0; lat < 90; lat += 90) {
			it('Result is positive', () => {
				assert.equal(true, (EmptyLocation.calcRelLngSize(lat) > 0));
			});
			it('Result is integer', () => {
				assert.equal(true, (
					Math.round(EmptyLocation.calcRelLngSize(lat)) === EmptyLocation.calcRelLngSize(lat)
				));
			});
			it('Result of dividing total longitude degrees is integer', () => {
				assert.equal(0, 3600000000 % EmptyLocation.calcRelLngSize(lat));
				assert.equal(0, 3600000000 % EmptyLocation.calcRelLngSize(-lat));
			});
		}
	});

	describe('Location north-west point latitude validation', () => {
		it('Result is boolean', () => {
			assert.equal('boolean', typeof EmptyLocation.validateLatitude(0));
		});

		for (let lat = 0; lat < 90; lat += 90) {
			it('Result of calculated north-west location point latitude is true', () => {
				const locLat = EmptyLocation.getNorthWestLocationLatitudeByPoint(lat);
				assert.equal(true, EmptyLocation.validateLatitude(locLat));
			});

			it('Result of not calculated latitude is false', () => {
				let locLat = EmptyLocation.getNorthWestLocationLatitudeByPoint(lat);
				locLat += EmptyLocation.relLatSize / 20000000;
				assert.equal(false, EmptyLocation.validateLatitude(locLat));
			});
		}
	});

	describe('Location north-west point longitude validation', () => {
		it('Result is boolean', () => {
			assert.equal('boolean', typeof EmptyLocation.validateLongitude(0, 0));
		});

		for (let lat = 0, lng = lat * 2; lat < 90; lat += 90, lng = lat * 2) {
			const loc = EmptyLocation.createLocationByPoint({
				lat,
				lng
			});

			it('Result of calculated north-west location point longitude is true', () => {
				assert.equal(true, EmptyLocation.validateLongitude(loc.northWest.lat, loc.northWest.lng));
			});

			it('Result of not calculated longitude is false', () => {
				const locLat = loc.northWest.lat + (EmptyLocation.relLatSize / 20000000);
				const locLng = loc.northWest.lng + (EmptyLocation.relLngSize / 20000000);
				assert.equal(false, EmptyLocation.validateLongitude(locLat, locLng));
			});
		}
	});
});
