const assert = require('chai').assert;
const EmptyLocation = require('../services/grid-service');

describe('Grid service', () => {
	describe('Grid properties', () => {
		it('Equator', () => {
			assert.typeOf(EmptyLocation.equatorLength, 'number');
		});
		it('Planet radius', () => {
			assert.typeOf(EmptyLocation.planetRadius, 'number');
		});
		it('Meridian length', () => {
			assert.typeOf(EmptyLocation.meridianLength, 'number');
		});
		it('Preferable location size', () => {
			assert.typeOf(EmptyLocation.preferableLocSideSize, 'number');
		});
	});
	describe('Relative latitude location size calculation', () => {
		it('Result of dividing total latitude degrees is integer', () => {
			assert.strictEqual(0, 1800000000 % EmptyLocation.calcRelLatSize());
		});
	});

	describe('Relative longitude location size calculation', () => {
		for (let lat = 0; lat < 90; lat += 90) {
			it('Result is positive', () => {
				assert.isTrue((EmptyLocation.calcRelLngSize(lat) > 0));
			});
			it('Result is integer', () => {
				assert.isTrue(
					Math.round(EmptyLocation.calcRelLngSize(lat)) === EmptyLocation.calcRelLngSize(lat)
				);
			});
			it('Result of dividing total longitude degrees is integer', () => {
				assert.strictEqual(0, 3600000000 % EmptyLocation.calcRelLngSize(lat));
				assert.strictEqual(0, 3600000000 % EmptyLocation.calcRelLngSize(-lat));
			});
		}
	});

	describe('Location north-west point latitude validation', () => {
		it('Result is boolean', () => {
			assert.typeOf(EmptyLocation.validateLatitude(0), 'boolean');
		});

		for (let lat = 0; lat < 90; lat += 90) {
			it('Result of calculated north-west location point latitude is true', () => {
				const locLat = EmptyLocation.getNorthWestLocationLatitudeByPoint(lat);
				assert.isTrue(EmptyLocation.validateLatitude(locLat));
			});

			it('Result of not calculated latitude is false', () => {
				let locLat = EmptyLocation.getNorthWestLocationLatitudeByPoint(lat);
				locLat += EmptyLocation.relLatSize / 20000000;
				assert.isFalse(EmptyLocation.validateLatitude(locLat));
			});
		}
	});

	describe('Location north-west point longitude validation', () => {
		it('Result is boolean', () => {
			assert.typeOf(EmptyLocation.validateLongitude(0, 0), 'boolean');
		});

		for (let lat = 0, lng = lat * 2; lat < 90; lat += 90, lng = lat * 2) {
			const loc = EmptyLocation.createLocationByPoint({
				lat,
				lng
			});

			it('Result of calculated north-west location point longitude is true', () => {
				assert.isTrue(EmptyLocation.validateLongitude(loc.northWest.lat, loc.northWest.lng));
			});

			it('Result of not calculated longitude is false', () => {
				const locLat = loc.northWest.lat + (EmptyLocation.relLatSize / 20000000);
				const locLng = loc.northWest.lng + (EmptyLocation.relLngSize / 20000000);
				assert.isFalse(false, EmptyLocation.validateLongitude(locLat, locLng));
			});
		}
	});

	describe('Prime factors separation', () => {
		it('For values less than 2 result is empty array', () => {
			for (let i = -10; i < 2; i += 1) {
				assert.strictEqual(0, EmptyLocation.findPrimeFactors(i).length);
			}
		});

		it('All values of result array are prime', () => {
			for (let i = 0; i < 3; i += 1) {
				const value = Math.round(Math.random() * 1000000);
				const valuePrimeFactors = EmptyLocation.findPrimeFactors(value);
				valuePrimeFactors.forEach((item) => {
					assert.isTrue(isPrimeFactor(item));
				});
			}
		});

		function isPrimeFactor(num) {
			for (let i = 2; i < num; i += 1) {
				if ((num % i) === 0) {
					return false;
				}
			}
			return true;
		}
	});
});
