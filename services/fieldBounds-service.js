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

		return this.getPreparedBorderLocs(borderLocs);
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

	// extractContour() {    
	// 	const contourA = [];
	//   const contourB = [];

	//   const 

	//   const startPointA = 
	//   const startPointB = 
	// }

	divideLocPoints(location, locGrowthCoofs) {
		const locPoints = location.mapFeatureCoords;

		let dividedPoints;
		let pointsA;
		let pointsB;

		switch (locGrowthCoofs.description) {
			case 'sharpAngle':
				pointsA = locPoints;
				pointsB = [];
				break;
			case 'horizontal':
				pointsA = [locPoints[1], locPoints[4]];
				pointsB = [locPoints[2], locPoints[3]];
				break;
			case 'vertical':
				pointsA = [locPoints[1], locPoints[2]];
				pointsB = [locPoints[3], locPoints[4]];
				break;
			default:
				dividedPoints = this.divideRectangleLocPoints(locPoints, locGrowthCoofs);
		}

		dividedPoints = dividedPoints || {
			pointsA,
			pointsB
		};

		return dividedPoints;
	}

	divideRectangleLocPoints(locPoints, locGrowthCoofs) {
		let pointsA;
		let pointsB;

		switch (locGrowthCoofs.angleDirection) {
			case 'northWest':
				pointsA = [locPoints[1], locPoints[2], locPoints[4]];
				pointsB = [locPoints[3]];
				break;
			case 'northEast':
				pointsA = [locPoints[1], locPoints[3], locPoints[4]];
				pointsB = [locPoints[2]];
				break;
			case 'southWest':
				pointsA = [locPoints[1], locPoints[2], locPoints[3]];
				pointsB = [locPoints[4]];
				break;
			case 'southEast':
				pointsA = [locPoints[2], locPoints[3], locPoints[4]];
				pointsB = [locPoints[1]];
				break;
			default:
				pointsA = [];
				pointsB = [];
		}

		return {
			pointsA,
			pointsB
		};
	}

	prepareBorderLocs(locArray) {
		const preparedLocsArray = locArray.slice(0);

		for (let i = 0, len = locArray.length; i < len; i += 1) {
			const locCoofs = this.getLocGrowsCoofs(0, locArray);
			if (!(locCoofs.description === 'sharpAngle')) return preparedLocsArray;

			const currentLoc = preparedLocsArray.shift();
			preparedLocsArray.push(currentLoc);
		}

		return [];
	}

	getBorderLocGrowsCoofsByIndex(i) {
		return this.getLocGrowsCoofs(i, this.borderLocations);
	}

	getLocGrowsCoofs(i, locArray) {
		const len = locArray.length;
		const currentLoc = locArray[i];
		const prevLoc = locArray[i - 1] || locArray[len - 1];
		const nextLoc = locArray[i + 1] || locArray[0];

		const prevCoofs = this.getGrowthCoofsForTwoLocs(prevLoc, currentLoc);
		const nextCoofs = this.getGrowthCoofsForTwoLocs(currentLoc, nextLoc);

		return {
			prev: prevCoofs,
			next: nextCoofs
		};
	}

	getGrowthCoofsForTwoLocs(prevLoc, nextLoc) {
		const prevNorthWest = prevLoc.northWest;
		const nextNorthWest = nextLoc.northWest;

		const latCoof = this.calcLocGrowthCoof(prevNorthWest.lat, nextNorthWest.lat);
		const lngCoof = this.calcLocGrowthCoof(prevNorthWest.lng, nextNorthWest.lng);

		return this.setGrowthCoofsQuickProps({
			lat: latCoof,
			lng: lngCoof
		});
	}

	calcLocGrowthCoof(prevValue, nextValue) {
		prevValue = Math.round(prevValue * 10000000);
		nextValue = Math.round(nextValue * 10000000);

		const diff = prevValue - nextValue;

		if (diff === 0) return 0;

		return diff > 0 ? 1 : -1;
	}

	setGrowthCoofsProps(growthCoofs) {
		const prev = growthCoofs.prev;
		const next = growthCoofs.next;
		if (
			((prev.lat !== 0) && (prev.lng !== 0)) &&
						((next.lat !== 0) && (next.lng !== 0))
		) {
			growthCoofs.description = 'sharpAngle';
			return growthCoofs;
		} else if ((prev.lat === 0) && (next.lat === 0)) {
			growthCoofs.description = 'horizontal';
			return growthCoofs;
		} else if ((prev.lng === 0) && (next.lng === 0)) {
			growthCoofs.description = 'vertical';
			return growthCoofs;
		}
		growthCoofs.description = 'rectangle';
		return this.setGrowthCoofsRectangleProps(growthCoofs);
	}

	setGrowthCoofsRectangleProps(growthCoofs) {
		const prev = growthCoofs.prev;
		const next = growthCoofs.next;
		const vertCoofs = prev.lat === 0 ? prev : next;
		const horCoofs = prev.lng === 0 ? prev : next;

		const vertical = horCoofs.lat > 0 ? 'north' : 'south';
		const horizontal = vertCoofs.lng > 0 ? 'East' : 'West';

		growthCoofs.angleDirection = vertical + horizontal;
		return growthCoofs;
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
