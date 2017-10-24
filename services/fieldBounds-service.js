const FieldBound = require('../models/bounds');
const EmptyLocation = require('./grid-service');

class BoundService {
	constructor(points) {
		this.rawPoints = points;
		this.peakLocations = this.calcPeakLocations();
		this.growthCoofs = this.calcGrowthCoofs();
		this.borderEquations = this.calcBorderEquations();
		this.borderLocations = this.calcBorderLocations();
		this.contourPoly = this.calcContourPoly();
	}

	calcPeakLocations() {
		const peakLocations = [];

		this.rawPoints.forEach((point) => {
			const location = EmptyLocation.createLocationByPoint(point);
			peakLocations.push(location);
		});

		return peakLocations;
	}

	calcBorderLocations() {
		let borderLocs = [];

		for (let i = 0, len = this.rawPoints.length; i < len; i += 1) {
			const locsOnBorder = this.calcLocationsOnLine(i);
			borderLocs = borderLocs.concat(locsOnBorder);
		}

		return this.prepareBorderLocs(borderLocs);
	}

	calcBorderEquations() {
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

	calcGrowthCoofs() {
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
				const newLng = (
					((lat - pointA.lat) /	(pointB.lat - pointA.lat)) *
					(pointB.lng - pointA.lng)
				) + pointA.lng;
				return newLng;
			},
			getLat(lng) {
				const newLat = (
					((lng - pointA.lng) /	(pointB.lng - pointA.lng)) *
					(pointB.lat - pointA.lat)
				) + pointA.lat;
				return newLat;
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
		} while (!BoundService.isEqualPoints(currentLoc.northWest, endLoc.northWest));

		return lineLocations;
	}

	calcNextLocationByPointIndex(location, i) {
		let nextLoc;
		const nextLatLoc = this.calcNextLocOnLat(location, i);

		const excCheck = !this.containsExclusive(nextLatLoc.mapFeatureCoords);
		const incCheck = this.containsInclusive(nextLatLoc.mapFeatureCoords);
		const containsCheck = excCheck && incCheck;

		if (nextLatLoc.intersectLine(this.borderEquations[i]) && containsCheck) {
			nextLoc = nextLatLoc;
		} else {
			nextLoc = this.calcNextLocOnLng(location, i);
		}
		return nextLoc;
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

	calcContourPoly() {
		const contour = this.extractContour();
		this.borderLocations = null;
		return this.filterCountour(contour);
	}

	filterCountour(contour) {
		contour = BoundService.contourFilters.filterEqualPoints(contour);
		contour = BoundService.contourFilters.filterDiagonal(contour);
		contour = BoundService.contourFilters.filterAsc(contour);
		contour = BoundService.contourFilters.filterDesc(contour);

		if (!BoundService.isEqualPoints(contour[0], contour[contour.length - 1])) {
			contour.push(contour[0]);
		}

		return contour;
	}

	extractContour(isExcluded) {
		const date = new Date();
		const startPoint = this.getStartPoint(isExcluded);
		const contour = [];
		let lastPoint = startPoint;

		this.borderLocations.forEach((location, i) => {
			let contourPoints = this.extractContourPoints(location, isExcluded);
			contourPoints = this.sortContourPoints(lastPoint, contourPoints, i, isExcluded);
			contourPoints.forEach((point) => {
				contour.push(point);
			});
			lastPoint = contour[contour.length - 1];
		});

		contour.push(startPoint);
		console.log(new Date() - date);

		return contour;
	}

	getStartPoint(isExcluded) {
		const locGrowthCoofs = this.getLocGrowthCoofsByIndex(0);
		const prev = locGrowthCoofs.prev;
		let startPoints = this.getStartPoints(isExcluded);
		const pointsLen = startPoints.length;

		if (pointsLen > 1) {
			startPoints = this.sortStartPoints(startPoints);

			if (prev.lat > 0 || prev.lng > 0) {
				startPoints.pop();
			} else {
				startPoints.shift();
			}
		}

		return startPoints[0];
	}

	getStartPoints(isExcluded) {
		const startLoc = this.borderLocations[0];
		const startPoints = this.extractContourPoints(startLoc, isExcluded);

		return startPoints;
	}

	sortStartPoints(points) {
		const pointsLen = points.length;


		if (pointsLen === 3) {
			for (let i = 0; i < pointsLen; i += 1) {
				const prevPoint = points[i - 1] || points[pointsLen - 1];
				const nextPoint = points[i + 1] || points[0];
				const prevPointCoof = this.calcGrowthCoofForLocPoints(prevPoint, points[i]);
				const nextPointCoof = this.calcGrowthCoofForLocPoints(points[i], nextPoint);
				if (
					(prevPointCoof.lat === 0 || prevPointCoof.lng === 0) &&
					(nextPointCoof.lat === 0 || nextPointCoof.lng === 0)
				) {
					points.splice(i, 1);
				}
			}
		}

		return points.sort((pointA, pointB) => {
			const latDiff = pointA.lat - pointB.lat;
			if (latDiff) {
				return latDiff;
			}

			return pointA.lng - pointB.lng;
		});
	}

	extractContourPoints(location, isExcluded) {
		const locPoints = location.mapFeatureCoords;
		const extracted = [];

		if (isExcluded) {
			locPoints.forEach((point) => {
				if (!this.containsPoint(point)) {
					extracted.push(point);
				}
			});
		} else {
			locPoints.forEach((point) => {
				if (this.containsPoint(point)) {
					extracted.push(point);
				}
			});
		}

		return extracted;
	}

	sortContourPoints(lastPoint, points, i, isExcluded) {
		const pointsLen = points.length;
		let result;

		switch (pointsLen) {
			case 0:
				result = points;
				break;
			case 1:
				if (BoundService.isEqualPoints(lastPoint, points[0])) {
					result = points;
				} else {
					result = [];
				}
				break;
			case 2:
			case 3:
				result = this.sortDividedPoints(points, lastPoint);
				break;
			default:
				result = this.sortNotDividedPoints(points, lastPoint, i, isExcluded);
		}
		return result;
	}

	sortDividedPoints(points, lastPoint) {
		const pointsLen = points.length;
		let result;

		if (pointsLen === 2) {
			result = this.sortTwoPoints(points, lastPoint);
		}
		if (pointsLen === 3) {
			result = this.sortThreePoints(points, lastPoint);
		}

		return result;
	}

	sortTwoPoints(points, lastPoint) {
		const result = [];

		points.forEach((point) => {
			if (BoundService.isEqualPoints(point, lastPoint)) {
				result[0] = point;
			} else {
				result[1] = point;
			}
		});

		return result;
	}

	sortThreePoints(points, lastPoint) {
		const result = [];

		points.forEach((point) => {
			const growthCoofs = BoundService.calcGrowthCoofForLocPoints(lastPoint, point);
			if (BoundService.isEqualPoints(point, lastPoint)) {
				result[0] = point;
			} else if (
				!BoundService.isEqualPoints(point, lastPoint) &&
				((growthCoofs.lat === 0) || (growthCoofs.lng === 0))
			) {
				result[1] = point;
			} else if ((growthCoofs.lat !== 0) && (growthCoofs.lng !== 0)) {
				result[2] = point;
			}
		});

		return result;
	}

	sortNotDividedPoints(points, lastPoint, i, isExcluded) {
		const borderLocs = this.borderLocations;
		const locGrowthCoofs = this.getLocGrowthCoofsByIndex(i);
		const prevLoc = borderLocs[i - 1] || borderLocs[0];
		const prevLocPoints = prevLoc.mapFeatureCoords;
		const commonPoint = this.findCommonPointsApartFrom(prevLocPoints, points, lastPoint);

		locGrowthCoofs.next = BoundService.calcGrowthCoofForLocPoints(lastPoint, commonPoint);

		for (let j = 0, len = points.length; j < len; j += 1) {
			if (BoundService.isEqualPoints(commonPoint, points[j])) {
				points.splice(j, 1);
				break;
			}
		}

		let result = this.sortThreePoints(points, lastPoint);

		if (locGrowthCoofs.description !== 'sharpAngle') {
			const nextLoc = borderLocs[i + 1] || borderLocs[borderLocs.length - 1];
			const nextLocPoints = this.extractContourPoints(nextLoc, isExcluded);

			result = this.filterExtractedPoints(result, nextLocPoints, i);
		}

		return result;
	}

	findCommonPointsApartFrom(pointsArrA, pointsArrB, apartPoint) {
		const lenA = pointsArrA.length;
		const lenB = pointsArrB.length;
		let result;
		for (let i = 0; i < lenA; i += 1) {
			for (let j = 0; j < lenB; j += 1) {
				if (
					BoundService.isEqualPoints(pointsArrA[i], pointsArrB[j]) &&
					!BoundService.isEqualPoints(pointsArrA[i], apartPoint)
				) {
					result = pointsArrB[j];
					break;
				}
			}
			if (result) break;
		}
		return result;
	}

	filterExtractedPoints(points, nextLocPoints) {
		points.forEach((point) => {
			let counter = 0;
			nextLocPoints.forEach((nextLocPoint) => {
				if (BoundService.isEqualPoints(point, nextLocPoint)) {
					counter += 1;
				}
			});

			if (counter > 1) {
				points.pop();
				this.filterExtractedPoints(points, nextLocPoints);
			}
		});
		return points;
	}

	prepareBorderLocs(locArray, isExcluded) {
		const preparedLocsArray = locArray.slice(0);

		for (let i = 0, len = locArray.length; i < len; i += 1) {
			const contourPoints = this.extractContourPoints(locArray[i], isExcluded);
			const pointsLen = contourPoints.length;
			if ((pointsLen >= 1) && (pointsLen <= 3)) return preparedLocsArray;

			const currentLoc = preparedLocsArray.shift();
			preparedLocsArray.push(currentLoc);
		}

		return preparedLocsArray;
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

	getLocGrowthCoofsByIndex(i) {
		const borderLocs = this.borderLocations;
		const prevLoc = borderLocs[i - 1] || borderLocs[borderLocs.length - 1];
		const nextLoc = borderLocs[i + 1] || borderLocs[0];

		const prev = this.getGrowthCoofsForTwoLocs(prevLoc, borderLocs[i]);
		const next = this.getGrowthCoofsForTwoLocs(borderLocs[i], nextLoc);

		return this.setGrowthCoofsProps({
			prev,
			next
		});
	}

	getGrowthCoofsForTwoLocs(prevLoc, nextLoc) {
		const prevNorthWest = prevLoc.northWest;
		const nextNorthWest = nextLoc.northWest;

		const coofs = BoundService.calcGrowthCoofForLocPoints(prevNorthWest, nextNorthWest);

		return coofs;
	}

	setGrowthCoofsProps(growthCoofs) {
		const prev = growthCoofs.prev;
		const next = growthCoofs.next;
		if ((prev.lat === 0) && (next.lat === 0)) {
			growthCoofs.description = 'horizontal';
		} else if ((prev.lng === 0) && (next.lng === 0)) {
			growthCoofs.description = 'vertical';
		} else if (
			(prev.lat === next.lat) && (next.lng === prev.lng)
		) {
			growthCoofs.description = 'sharpAngle';
		} else {
			growthCoofs.description = 'rectangle';
		}
		return growthCoofs;
	}

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

		if (!len) {
			return false;
		}

		for (let i = 0; i < len; i += 2) {
			if (
				(point.lng >= intersectPoints[i].lng) &&
				(point.lng <= intersectPoints[i + 1].lng)
			) {
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

			const maxLat = pointA.lat > pointB.lat ? pointA.lat : pointB.lat;
			const minLat = pointA.lat < pointB.lat ? pointA.lat : pointB.lat;

			if ((lat <= maxLat) && (lat >= minLat)) {
				intersectPoints.push({
					lat,
					lng: intersectLng
				});
			}
		});

		return intersectPoints.sort((pointA, pointB) => (pointA.lng - pointB.lng));
	}

	static calcGrowthCoofForLocPoints(pointA, pointB) {
		const result = {
			lat: BoundService.calcLocGrowthCoof(pointA.lat, pointB.lat),
			lng: BoundService.calcLocGrowthCoof(pointA.lng, pointB.lng)
		};

		return result;
	}

	static calcLocGrowthCoof(prevValue, nextValue) {
		prevValue = Math.round(prevValue * 10000000);
		nextValue = Math.round(nextValue * 10000000);

		const diff = prevValue - nextValue;

		if (diff === 0) return 0;

		return diff > 0 ? 1 : -1;
	}

	static isEqualPoints(pointA, pointB) {
		const result = (pointA.lat === pointB.lat) && (pointA.lng === pointB.lng);
		return result;
	}


	static get contourFilters() {
		return {
			filterEqualPoints: (contour) => {
				for (let i = 0; i < contour.length; i += 1) {
					const nextPoint = contour[i + 1];

					if (!nextPoint) break;

					if (BoundService.isEqualPoints(contour[i], nextPoint)) {
						contour.splice(i, 1);
						i -= 1;
					}
				}

				return contour;
			},
			filterDiagonal: (contour) => {
				for (let i = 0; i < contour.length; i += 1) {
					const currentPoint = contour[i];
					const nextPoint = contour[i + 1] || contour[0];
					const pointCoofs = BoundService.calcGrowthCoofForLocPoints(currentPoint, nextPoint);

					if (
						(pointCoofs.lat !== 0) && (pointCoofs.lng !== 0)
					) {
						console.log(i, contour.indexOf(nextPoint));
						contour.splice(i, 1);
						i = -1;
					}
				}
				return contour;
			},
			filterAsc: (contour) => {
				for (let i = 0; i < contour.length; i += 1) {
					const currentPoint = contour[i - 1] || contour[contour.length - 1];
					const afterNextPoint = contour[i + 1] || contour[0];

					if (!afterNextPoint) {
						break;
					}

					if (
						(afterNextPoint.lat === currentPoint.lat) ||
												(afterNextPoint.lng === currentPoint.lng)
					) {
						contour.splice(i, 1);
						i = 0;
					}
				}
				return contour;
			},
			filterDesc: (contour) => {
				for (let i = contour.length; i > 0; i -= 1) {
					const currentPoint = contour[i] || contour[0];
					const afterNextPoint = contour[i - 2];

					if (!afterNextPoint) {
						break;
					}

					if (
						(afterNextPoint.lat === currentPoint.lat) ||
												(afterNextPoint.lng === currentPoint.lng)
					) {
						contour.splice(i - 1, 1);
						console.log(i - 1);
						i = contour.length;
					}
				}
				return contour;
			}
		};
	}

	static getBoundsById(id) {
		if (BoundService.cache[id]) {
			return Promise.resolve(BoundService.cache[id]);
		}

		return FieldBound.getFigurePointsById(id)
			.then((points) => {
				const bounds = new BoundService(points);
				BoundService.cache[id] = bounds;
				return bounds;
			});
	}

	static getGameBoundsPolygon(id) {
		return BoundService.getBoundsById(id)
			.then(bounds => bounds.contourPoly);
	}

	static validateGameBoundsByBoundsId(northWest, id) {
		return BoundService.getBoundsById(id)
			.then(bounds => bounds.containsLocByNorthWest(northWest));
	}
}

BoundService.cache = {};

module.exports = BoundService;
