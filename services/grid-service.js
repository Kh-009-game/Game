class EmptyLocation {
	constructor(northWestPoint) {
		this.northWest = northWestPoint;
		this.center = this.calcCenterPoint();
		this.mapFeatureCoords = this.getMapFeatureCoords();
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

	calcCenterPoint() {
		const lat = this.northWest.lat - (this.relLatSize / 2);
		const lng = this.northWest.lng - (this.relLngSize / 2);

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
			lat: ((this.northWest.lat * 10000000) - EmptyLocation.relLatSize) / 10000000,
			lng: +this.northWest.lng
		}, {
			// south east
			lat: ((this.northWest.lat * 10000000) - EmptyLocation.relLatSize) / 10000000,
			lng: ((this.northWest.lng * 10000000) + this.relLngSize) / 10000000
		}, {
			// north east
			lat: +this.northWest.lat,
			lng: ((this.northWest.lng * 10000000) + this.relLngSize) / 10000000
		}];
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

	static createLocationByPoint(point) {
		const northWestPoint = EmptyLocation.calcNorthWestByPoint(point);

		return new EmptyLocation(northWestPoint);
	}

	static calcNorthWestByPoint(point) {
		return {
			lat: EmptyLocation.getNorthWestLocationLatitudeByPoint(point.lat),
			lng: EmptyLocation.getNorthWestLocationLongitudeByPoint(point)
		};
	}

	static getNorthWestLocationLatitudeByPoint(pointLat) {
		const relLatSize = EmptyLocation.calcRelLatSize();
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
		lngPrimeFactorsArr.splice(-1);

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

	static get equatorLength() {
		return 40075696;
	}

	static get planetRadius() {
		return 6370997;
	}

	static get meridianLength() {
		return 20004274;
	}

	static get preferableLocSideSize() {
		return 100;
	}

	static get locSideMetersSizeOnEquatorLat() {
		return EmptyLocation.preferableLocSideSize * 1.5;
	}

	static get minAbsoluteLatSize() {
		return EmptyLocation.meridianLength / 1800000000;
	}

	static get minAbsoluteLngSize() {
		return EmptyLocation.equatorLength / 3600000000;
	}

	static get lngSizeCoefficients() {
		return this.getLatutideBreakpointsObject();
	}

	static get latBreakPoints() {
		return Object.keys(EmptyLocation.lngSizeCoefficients);
	}

	static get relLatSize() {
		return EmptyLocation.calcRelLatSize();
	}

	static get initialRelativeLngSize() {
		return EmptyLocation.getClosestRelSize(
			Math.round(
				EmptyLocation.locSideMetersSizeOnEquatorLat / EmptyLocation.minAbsoluteLngSize
			), 'lng');
	}
}

module.exports = EmptyLocation;
