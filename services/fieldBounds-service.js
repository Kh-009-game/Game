// const FieldBound = require('../models/bounds');
const EmptyLocation = require('./grid-service');

const rawPoints = [{
	lat: 50.00085,
	lng: 36.22336
}, {
	lat: 50.00805,
	lng: 36.2336
}, {
	lat: 49.99365,
	lng: 36.2464
}, {
	lat: 49.98375,
	lng: 36.22592
}];

let instance;

class BoundService {
	constructor(points) {
		this.rawPoints = points;
	}

	get peakLocations() {
		const peakLocations = [];

		this.rawPoints.forEach((point) => {
			const location = EmptyLocation.createLocationByPoint(point);
			peakLocations.push(location);
		});

		return peakLocations;
	}

	get borderLocations() {
		let borderLocs = [];

		for (let i = 0, len = this.rawPoints.length; i < len; i += 1) {
			const locsOnBorder = this.calcLocationsOnLine(i);
			borderLocs = borderLocs.concat(locsOnBorder);
		}

		return borderLocs;
	}

	get borderEquations() {
		const equations = [];

		this.rawPoints.forEach((point, i) => {
			const j = this.rawPoints[i + 1] ? i + 1 : 0;
			equations.push(
				this.calcLineEquation(
					this.rawPoints[i],
					this.rawPoints[j]
				)
			);
		});

		return equations;
	}

	get growthCoofs() {
		const coofs = [];

		this.rawPoints.forEach((point, i) => {
			const pointA = point;
			const pointB = this.rawPoints[i + 1] || this.rawPoints[0];

			coofs.push(
				this.calcGrowthCoofForPoints(pointA, pointB)
			);
		});

		return coofs;
	}

	calcGrowthCoofForPoints(pointA, pointB) {
		const lat = (pointA.lat - pointB.lat) > 0 ? -1 : 1;
		const lng = (pointA.lng - pointB.lng) > 0 ? -1 : 1;

		return {
			lat,
			lng
		};
	}

	calcLineEquation(pointA, pointB) {
		return {
			getLng(lat) {
				const newLat = ((pointA.lat - pointB.lat) * lat)
								/ (pointA.lng - pointB.lng);
				return newLat;
			},
			getLat(lng) {
				const newLng = ((pointA.lng - pointB.lng) * lng)
								/ (pointA.lat - pointB.lat);
				return newLng;
			}
		};
	}

	calcLocationsOnLine(startPointIndex) {
		const startLoc = this.peakLocations[startPointIndex];
		const endLoc = this.peakLocations[startPointIndex + 1] || this.peakLocations[0];
		const lineLocations = [];

		let currentLoc = startLoc;

		do {
			lineLocations.push(currentLoc);
			currentLoc = this.calcNextLocationByPointIndex(currentLoc, startPointIndex);
		} while (
			(currentLoc.northWest.lat !== endLoc.northWest.lat) &&
			(currentLoc.northWest.lng !== endLoc.northWest.lng)
		);

		return lineLocations;
	}

	calcNextLocationByPointIndex(location, i) {
		const nextLatLoc = this.calcNextLocOnLat(location, i);

		const latForCheck = nextLatLoc.center.lat;
		const lngForCheck = this.borderEquations[i].getLng(latForCheck);

		const northWest = EmptyLocation.calcNorthWestByPoint({
			lat: latForCheck,
			lng: lngForCheck
		});

		if (northWest.lng === nextLatLoc.northWest.lng) {
			return nextLatLoc;
		}

		const nextLngLoc = this.calcNextLocOnLng(location, i);

		return nextLngLoc;
	}

	calcNextLocOnLat(location, i) {
		const growthCoof = this.growthCoofs[i].lat;
		const latDiff = growthCoof * (EmptyLocation.relLatSize / 10000000);

		const nextLocCenterLat = location.center.lat + latDiff;
		const nextLocCenter = {
			lat: nextLocCenterLat,
			lng: location.center.lng
		};

		const nextLoc = EmptyLocation.createLocationByPoint(nextLocCenter);

		return nextLoc;
	}

	calcNextLocOnLng(location, i) {
		const growthCoof = this.growthCoofs[i].lng;
		const lngDiff = growthCoof * (location.relLngSize / 10000000);

		const nextLocCenterLng = location.center.lng + lngDiff;
		const nextLocCenter = {
			lat: location.center.lat,
			lng: nextLocCenterLng
		};

		const nextLoc = EmptyLocation.createLocationByPoint(nextLocCenter);

		return nextLoc;
	}

	get contourPoly() {
		return this.extractContour;
	}

	extractContour() {

	}

	// containsLocByNorthWest(point) {
	// 	const borderLocsOnLat = [];

	// 	this.borderLocs.forEach((location) => {
	// 		const borderLat = location.northWest.lat;
	// 		if (borderLat === point.lat) {
	// 			borderLocsOnLat.push(location);
	// 		}
	// 	});

	// 	const len = borderLocsOnLat.length;

	// 	if (!len) return false;

	// 	for (let i = 0; i < len; i += 2) {
	// 		const centerLng1 = borderLocsOnLat[i].northWest.lng;
	// 		const centerLng2 = borderLocsOnLat[i + 1].northWest.lng;

	// 		const lngMax = centerLng1 > centerLng2 ? centerLng1 : centerLng2;
	// 		const lngMin = centerLng1 < centerLng2 ? centerLng1 : centerLng2;

	// 		if ((point.lng < lngMax) && (point.lng > lngMin)) {
	// 			return true;
	// 		}
	// 	}

	// 	return false;
	// }

	containsLocByNorthWest(northWest, inclusive) {
		const location = EmptyLocation.createLocationByPoint(northWest);
		const polygon = location.mapFeatureCoords;

		if (inclusive) {
			return this.containsInclusive(polygon);
		}

		return this.containsExclusive(polygon);
	}

	containsInclusive(polygonPoints) {
		for (let i = 0, len = polygonPoints.length; i < len; i += 1) {
			if (this.containsPoint(polygonPoints[i])) return true;
		}
		return false;
	}

	containsExclusive(polygonPoints) {
		for (let i = 0, len = polygonPoints.length; i < len; i += 1) {
			if (!this.containsPoint(polygonPoints[i])) return false;
		}
		return true;
	}

	containsPoint(point) {
		const intersectPoints = this.getIntersectionByLat(point.lat);

		const len = intersectPoints.length;

		if (!len) return false;

		for (let i = 0; i < len; i += 2) {
			if ((point.lng > intersectPoints[i].lng) && (point.lng < intersectPoints[i + 1].lng)) {
				return true;
			}
		}

		return false;
	}

	getIntersectionByLat(lat) {
		const intersectPoints = [];

		this.borderEquations.forEach((eq, i) => {
			const intersectLng = eq.getLng(lat);

			const pointA = this.rawPoints[i];
			const pointB = this.rawPoints[i + 1] || this.rawPoints[0];
			const maxLng = pointA.lng > pointB.lng ? pointA.lng : pointB.lng;
			const minLng = pointA.lng < pointB.lng ? pointA.lng : pointB.lng;

			if ((intersectLng < maxLng) && (intersectLng > minLng)) {
				intersectPoints.push({
					lat,
					lng: intersectLng
				});
			}
		});

		return intersectPoints.sort((pointA, pointB) => (pointA.lng - pointB.lng));
	}
}

const bounds = new BoundService(rawPoints);
const borderLocations = bounds.borderLocations;
console.log(borderLocations);

module.exports = BoundService;