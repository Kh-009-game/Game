const assert = require('assert');
const EmptyLocation = require('../services/grid-service');

describe('Grid service', () => {
	describe('Relative latitude location size calculation', () => {
		it('Result of dividing total latitude degrees must be integer', () => {
			assert.equal(0, 1800000000 % EmptyLocation.calcRelLatSize());
		});
	});

	describe('Relative longitude location size calculation', () => {
		for (let lat = 0; lat < 90; lat += 10) {
			it('Result of dividing total longitude degrees must be integer', () => {
				assert.equal(0, 3600000000 % EmptyLocation.calcRelLngSize(lat));
				assert.equal(0, 3600000000 % EmptyLocation.calcRelLngSize(-lat));
			});
		}
	});
	
});
