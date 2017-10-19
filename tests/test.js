const assert = require('assert');
const EmptyLocation = require('../services/grid-service');

describe('Array', () => {
	describe('North-west location point calculation by given point', () => {
		it('North-west location point is an object', () => {
			assert.equal('object', typeof EmptyLocation.calcNorthWestByPoint({
				lat: 0,
				lng: 0
			}));
		});
		it('should return (0, 0) when the given point is (0, 0)', () => {
			assert.equal(0, EmptyLocation.calcNorthWestByPoint({
				lat: 0,
				lng: 0
			}).lat);
			assert.equal(0, EmptyLocation.calcNorthWestByPoint({
				lat: 0,
				lng: 0
			}).lng);
		});
		it('should return (0, 0) when the given point is (-0.00045, 0.00064)', () => {
			assert.equal(0, EmptyLocation.calcNorthWestByPoint({
				lat: -0.00045,
				lng: 0.00064
			}).lat);
			assert.equal(0, EmptyLocation.calcNorthWestByPoint({
				lat: -0.00045,
				lng: 0.00064
			}).lng);
		});
		it('should return (1.0008, 0.99968) when the given point is (1, 1)', () => {
			assert.equal(1.0008, EmptyLocation.calcNorthWestByPoint({
				lat: 1,
				lng: 1
			}).lat);
			assert.equal(0.99968, EmptyLocation.calcNorthWestByPoint({
				lat: 1,
				lng: 1
			}).lng);
		});
		it('should return (-0.9999, -1.00096) when the given point is (-1, -1)', () => {
			assert.equal(-0.9999, EmptyLocation.calcNorthWestByPoint({
				lat: -1,
				lng: -1
			}).lat);
			assert.equal(-1.00096, EmptyLocation.calcNorthWestByPoint({
				lat: -1,
				lng: -1
			}).lng);
		});

		it('should return (-0.9999, -1.00096) when the given point is (-1, -1)', () => {
			assert.equal(-90, EmptyLocation.calcNorthWestByPoint({
				lat: -90,
				lng: -0
			}).lat);
			assert.equal(0, EmptyLocation.calcNorthWestByPoint({
				lat: -90,
				lng: -0
			}).lng);
		});
	});
});
