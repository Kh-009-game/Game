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
			lng: nextLocCenterLng		};

		const nextLoc = EmptyLocation.createLocationByPoint(nextLocCenter);

		return nextLoc;
	}
}

const bounds = new BoundService(rawPoints);
const borderLocations = bounds.borderLocations;
console.log(borderLocations);

module.exports = BoundService;
