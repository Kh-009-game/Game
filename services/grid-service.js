const config = require('../config.json');

class EmptyLocation {
	constructor(northWestPoint, isAllowed) {
		this.northWest = northWestPoint;
		this.mapFeatureCoords = this.getMapFeatureCoords();
		this.center = this.calcCenterPoint();
		this.isAllowed = isAllowed;
	}

	get absoluteMercatorWidthToHeight() {
		let width = EmptyLocation.recalcLngToMercator(this.mapFeatureCoords[0].lng)
				- EmptyLocation.recalcLngToMercator(this.mapFeatureCoords[2].lng);

		let height = EmptyLocation.recalcLatToMercator(this.mapFeatureCoords[0].lat)
				- EmptyLocation.recalcLatToMercator(this.mapFeatureCoords[1].lat);

		height = height > 0 ? height : height * -1;
		width = width > 0 ? width : width * -1;

		return width / height;
	}

	static calcCenterPoint(point) {
		const relLngSize = EmptyLocation.calcRelLngSize(point.lat);
		const lat = +point.lat - (EmptyLocation.relLatSize / 20000000);
		const lng = +point.lng + (relLngSize / 20000000);

		return {
			lat,
			lng
		};
	}

	calcCenterPoint() {
		const lat = +this.northWest.lat - (EmptyLocation.relLatSize / 20000000);
		const lng = +this.northWest.lng + (this.relLngSize / 20000000);

		return {
			lat,
			lng
		};
	}

	get relLngSize() {
		return EmptyLocation.calcRelLngSize(this.northWest.lat);
	}

	getMapFeatureCoords() {
		return [{
			// north west
			lat: +this.northWest.lat,
			lng: +this.northWest.lng
		}, {
			// south west
			lat: (Math.round(this.northWest.lat * 10000000) - EmptyLocation.relLatSize) / 10000000,
			lng: +this.northWest.lng
		}, {
			// south east
			lat: (Math.round(this.northWest.lat * 10000000) - EmptyLocation.relLatSize) / 10000000,
			lng: (Math.round(this.northWest.lng * 10000000) + this.relLngSize) / 10000000
		}, {
			// north east
			lat: +this.northWest.lat,
			lng: (Math.round(this.northWest.lng * 10000000) + this.relLngSize) / 10000000
		}];
	}

	intersectLine(lineFuncs) {
		const points = this.mapFeatureCoords;
		const north = points[0].lat;
		const south = points[1].lat;
		const east = points[2].lng;
		const west = points[1].lng;
		const northIntLng = lineFuncs.getLng(north);
		const southIntLng = lineFuncs.getLng(south);

		if (
			(northIntLng <= east && northIntLng >= west) ||
			(southIntLng <= east && southIntLng >= west) ||
			(northIntLng >= east && southIntLng <= west) ||
			(southIntLng >= east && northIntLng <= west)
		) {
			return true;
		}

		return false;
	}

	static calcRelLatSize() {
		return EmptyLocation.getClosestRelSize(
			Math.round(EmptyLocation.preferableLocSideSize / EmptyLocation.minAbsoluteLatSize),
			'lat'
		);
	}
	static calcRelLngSize(pointLat) {
		let result;
		const lngSizeCoefficients = EmptyLocation.lngSizeCoefficients;
		const breakPoints = EmptyLocation.latBreakPoints;

		if (pointLat < 0) {
			pointLat = (pointLat - (EmptyLocation.relLatSize / 10000000)) * (-1);
		}

		if (pointLat <= breakPoints[0]) {
			return EmptyLocation.initialRelativeLngSize;
		}

		for (let i = 0, maxValue = EmptyLocation.latBreakPoints.length; i < maxValue; i += 1) {
			if (
				(pointLat > breakPoints[i] && pointLat <= breakPoints[i + 1]) ||
					(pointLat > breakPoints[i] && !breakPoints[i + 1])
			) {
				result = EmptyLocation.initialRelativeLngSize * lngSizeCoefficients[breakPoints[i]];
				break;
			}
		}

		return result;
	}

	static createLocationByPoint(point, isAllowed) {
		const northWestPoint = EmptyLocation.calcNorthWestByPoint(point);

		return new EmptyLocation(northWestPoint, isAllowed);
	}

	static calcNorthWestByPoint(point) {
		return {
			lat: EmptyLocation.getNorthWestLocationLatitudeByPoint(point.lat),
			lng: EmptyLocation.getNorthWestLocationLongitudeByPoint(point)
		};
	}

	static getNorthWestLocationLatitudeByPoint(pointLat) {
		const relLatSize = EmptyLocation.relLatSize;
		return (
			Math.ceil(
				Math.round(pointLat * 10000000) / relLatSize
			) * relLatSize
		) /	10000000;
	}

	static getNorthWestLocationLongitudeByPoint(point) {
		const relLngSize = EmptyLocation.calcRelLngSize(point.lat);
		return (
			Math.floor(
				Math.round(point.lng * 10000000) / relLngSize
			) * relLngSize
		) /	10000000;
	}

	static calcPointToMercator(point) {
		return {
			lat: EmptyLocation.recalcLatToMercator(point.lat),
			lng: EmptyLocation.recalcLngToMercator(point.lng)
		};
	}

	static recalcLngToMercator(lng) {
		const lngRad = (lng / 180) * Math.PI;
		return lngRad * EmptyLocation.planetRadius;
	}

	static recalcLatToMercator(lat) {
		const latRad = (lat / 180) * Math.PI;
		return EmptyLocation.planetRadius * Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
	}

	static getLatutideBreakpointsObject() {
		const lngSizeCoefficients = {};
		let lngPrimeFactorsArr = EmptyLocation.findPrimeFactors(
			3600000000 / EmptyLocation.initialRelativeLngSize
		);
		lngPrimeFactorsArr.pop();

		lngPrimeFactorsArr = lngPrimeFactorsArr.map((item) => {
			if (item > 2) {
				return [item / 2, 2];
			}
			return item;
		});

		for (let i = 0; i < lngPrimeFactorsArr.length; i += 1) {
			if (Array.isArray(lngPrimeFactorsArr[i])) {
				const innerArr = lngPrimeFactorsArr.splice(i, 1)[0];
				i -= 1;
				innerArr.forEach((currentValue) => {
					lngPrimeFactorsArr.push(currentValue);
				});
			}
		}

		let lngSizeCoefficient = 1;

		lngPrimeFactorsArr.forEach((currentValue) => {
			lngSizeCoefficient *= currentValue;
			let lngBreakPoint = (Math.acos(1 / lngSizeCoefficient) * 180) / Math.PI;
			lngBreakPoint = (
				Math.floor(
					Math.round(lngBreakPoint * 10000000) / EmptyLocation.relLatSize
				) * EmptyLocation.relLatSize
			) /	10000000;
			lngSizeCoefficients[lngBreakPoint] = lngSizeCoefficient;
		});

		return lngSizeCoefficients;
	}

	static getClosestRelSize(preferRelSize, latOrLng) {
		let maxDeg;
		if (latOrLng === 'lat') {
			maxDeg = 1800000000;
		} else if (latOrLng === 'lng') {
			maxDeg = 3600000000;
		} else {
			return false;
		}

		if (Math.round(maxDeg / this.preferRelSize) === maxDeg / this.preferRelSize) {
			return preferRelSize;
		}

		if (Math.round(maxDeg / this.preferRelSize) !== maxDeg / this.preferRelSize) {
			let relativeSizeToIncrease = preferRelSize;
			let relativeSizeToDecrease = preferRelSize;
			while (true) {
				relativeSizeToIncrease += 1;
				relativeSizeToDecrease -= 1;
				if (Math.round(maxDeg / relativeSizeToIncrease) === maxDeg / relativeSizeToIncrease) {
					preferRelSize = relativeSizeToIncrease;
					break;
				}

				if (Math.round(maxDeg / relativeSizeToDecrease) === maxDeg / relativeSizeToDecrease) {
					preferRelSize = relativeSizeToDecrease;
					break;
				}
			}
		}
		return preferRelSize;
	}

	static findPrimeFactors(value) {
		if (value < 2) return [];
		let tempValue = value;
		let checker = 2;
		const result = [];

		while (checker * checker <= tempValue) {
			if (tempValue % checker === 0) {
				result.push(checker);
				tempValue /= checker;
			} else {
				checker += 1;
			}
		}
		if (tempValue !== 1)	{
			result.push(tempValue);
		}
		return result;
	}

	static validateLatitude(lat) {
		const checkedLat = EmptyLocation.getNorthWestLocationLatitudeByPoint(lat);
		return checkedLat === lat;
	}

	static validateLongitude(lat, lng) {
		const checkedLng = EmptyLocation.getNorthWestLocationLongitudeByPoint({
			lat,
			lng
		});
		return checkedLng === lng;
	}
}

EmptyLocation.equatorLength = config.equator;
EmptyLocation.planetRadius = config.planetRadius;
EmptyLocation.meridianLength = config.meridian;
EmptyLocation.preferableLocSideSize = config.LocSideSize;
EmptyLocation.locSideMetersSizeOnEquatorLat = EmptyLocation.preferableLocSideSize * 1.5;
EmptyLocation.minAbsoluteLatSize = EmptyLocation.meridianLength / 1800000000;
EmptyLocation.minAbsoluteLngSize = EmptyLocation.equatorLength / 3600000000;
EmptyLocation.relLatSize = EmptyLocation.calcRelLatSize();
EmptyLocation.initialRelativeLngSize = EmptyLocation.getClosestRelSize(
	Math.round(
		EmptyLocation.locSideMetersSizeOnEquatorLat / EmptyLocation.minAbsoluteLngSize
	), 'lng');
EmptyLocation.lngSizeCoefficients = EmptyLocation.getLatutideBreakpointsObject();
EmptyLocation.latBreakPoints = Object.keys(EmptyLocation.lngSizeCoefficients);

module.exports = EmptyLocation;
