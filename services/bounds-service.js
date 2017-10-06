const EmptyLocation = require('./grid-service');
const Config = require('../config');
const Bounds = require('../models/bounds-orm');

let bounds = [];
const validateBounds = [];
module.exports.getGameBounds = function () {
	if (bounds.length > 0) {
		return new Promise((res, rej) => {
			console.log('return saved bounds');
			res(bounds);
			// res(this.getValidationPoints());
		});
	}
	return Bounds.findAll({ where: { figure_id: 1 } })
		.then((points) => {
			console.log(points);
			if (points.length === 0) {
				const bulkArr = [];
				console.log('points length 0');
				const pointsArr = Config.gameBounds;
				for (let i = 0; i < pointsArr.length; i++) {
					const valuesObj = {};
					valuesObj.figure_id = 1;
					valuesObj.lat = pointsArr[i].lat;
					valuesObj.lng = pointsArr[i].lng;
					bulkArr.push(valuesObj);
				}
				return Bounds.bulkCreate(bulkArr)
					.then(() => {
						console.log('done!');
						return calcGameBounds(pointsArr);
					})
					.catch(err => console.log(err));
			}
			// points = calcGameBounds(points);
			console.log('calculating bounds points from table');
			const boundsArr = [];
			console.log(points[0].dataValues);
			for (let i = 0; i < points.length; i++) {
				console.log(points[i].dataValues);
				const coordsObj = {};
				coordsObj.lat = points[i].dataValues.lat;
				coordsObj.lng = points[i].dataValues.lng;
				boundsArr.push(coordsObj);
			}
			bounds = calcGameBounds(boundsArr);
			return bounds;
		})
		.catch((err) => {
			throw new Error(err);
		});
};

module.exports.getValidationPoints = function () {
	const defaultLngOffset = 0.00128;
	const defaultLatOffset = 0.09;
	for (let i = 0; i < bounds.length; i++) {
		validateBounds.push({ lat: bounds[i].lat, lng: bounds[i].lng });
		if (!bounds[i + 1]) break;
		let latOffset = bounds[i].lat.toFixed(5) - bounds[i + 1].lat.toFixed(5);
		let lngOffset = bounds[i].lng.toFixed(5) - bounds[i + 1].lng.toFixed(5);
		console.log(latOffset);
		console.log(lngOffset);

		const sign = latOffset > 0;
		const sign1 = lngOffset > 0;
		while (Math.abs(latOffset).toFixed(4) > defaultLatOffset) {
			if (sign) {
				validateBounds.push({ lat: bounds[i].lat + defaultLatOffset, lng: bounds[i].lng });
			} else {
				validateBounds.push({ lat: bounds[i].lat - defaultLatOffset, lng: bounds[i].lng });
			}
			latOffset = Math.abs(latOffset) - defaultLatOffset;
			console.log(latOffset);
		}
		while (Math.abs(lngOffset).toFixed(5) > defaultLngOffset) {
			if (sign1) {
				validateBounds.push({ lat: bounds[i].lat, lng: bounds[i].lng + defaultLngOffset });
			} else {
				validateBounds.push({ lat: bounds[i].lat, lng: bounds[i].lng - defaultLngOffset });
			}
			lngOffset = Math.abs(lngOffset) - defaultLngOffset;
			console.log(lngOffset);
		}
		// if (!bounds[i + 2]) {
		// 	validateBounds.push({ lat: bounds[i + 1].lat, lng: bounds[i + 1].lng });
		// 	break;
		// }

		// validateBounds.push({ lat: bounds[i].lat, lng: bounds[i].lng })
	}

	return validateBounds;
};


function calcGameBounds(boundsCoords) {
	// const boundsCoords = Config.gameBounds;
	const pointsArr = [];
	for (let i = 0; i < boundsCoords.length; i++) {
		let startPointLoc = EmptyLocation.createLocationByPoint(boundsCoords[i]);
		let endPointLoc;
		if (!boundsCoords[i + 1]) {
			startPointLoc = EmptyLocation.createLocationByPoint(boundsCoords[0]);
			endPointLoc = EmptyLocation.createLocationByPoint(boundsCoords[boundsCoords.length - 1]);
		} else {
			endPointLoc = EmptyLocation.createLocationByPoint(boundsCoords[i + 1]);
		}
		pointsArr.push(startPointLoc.northWest);
		while (true) {
			const direction = checkDirection(startPointLoc.northWest, endPointLoc.northWest);
			startPointLoc = assemblePoints(direction, startPointLoc, pointsArr);
			if (!startPointLoc) break;
		}
		pointsArr.push(endPointLoc.northWest);
	}
	return pointsArr;
}

function assemblePoints(direction, startPLoc, pointsArr) {
	switch (direction) {
		case 'toTheSouthWest': {
			const newLng = startPLoc.northWest.lng - 0.001;
			const newPoint = { lat: startPLoc.northWest.lat, lng: newLng };
			startPLoc = EmptyLocation.createLocationByPoint(newPoint);
			pointsArr.push(startPLoc.northWest);
			// south west
			pointsArr.push(startPLoc.getMapFeatureCoords()[1]);
			const newNorthWest = startPLoc.getMapFeatureCoords()[1];
			startPLoc.northWest = newNorthWest;
			return startPLoc;
		}
		case 'toTheSouthEast': {
			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);
			pointsArr.push(startPLoc.getMapFeatureCoords()[2]);
			// go to East
			const newLng = startPLoc.getMapFeatureCoords()[3].lng + 0.001;
			const newPoint = { lat: startPLoc.getMapFeatureCoords()[2].lat, lng: newLng };
			startPLoc = EmptyLocation.createLocationByPoint(newPoint);
			return startPLoc;
		}
		case 'toTheNorthWest': {
			const newLng = startPLoc.northWest.lng - 0.001;
			const newLat = startPLoc.northWest.lat + 0.001;
			const newPoint = { lat: newLat, lng: newLng };
			startPLoc = EmptyLocation.createLocationByPoint(newPoint);
			// north east
			pointsArr.push(startPLoc.getMapFeatureCoords()[3], 1);
			pointsArr.push(startPLoc.northWest);

			return startPLoc;
		}
		case 'toTheNorthEast': {
			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);
			const newLng = startPLoc.getMapFeatureCoords()[3].lng + 0.001;
			const newLat = startPLoc.northWest.lat + 0.001;
			const newPoint = { lat: newLat, lng: newLng };
			startPLoc = EmptyLocation.createLocationByPoint(newPoint);

			pointsArr.push(startPLoc.northWest);
			return startPLoc;
		}
		case 'stop': {
			return false;
		}
		default:
			return false;
	}
}
function checkDirection(p1, p2) {
	let direction = '';
	if (p1.lat > p2.lat) {
		if (p1.lng > p2.lng) {
			direction = 'toTheSouthWest';
		} else if (p1.lng < p2.lng) {
			direction = 'toTheSouthEast';
		} else {
			direction = 'stop';
		}
	} else if (p1.lat < p2.lat) {
		if (p1.lng > p2.lng) {
			direction = 'toTheNorthWest';
		} else if (p1.lng < p2.lng) {
			direction = 'toTheNorthEast';
		} else {
			direction = 'stop';
		}
	} else {
		direction = 'stop';
	}
	return direction;
}
