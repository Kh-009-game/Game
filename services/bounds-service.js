const EmptyLocation = require('./grid-service');
const Config = require('../config');

module.exports.calcGameBounds = function () {
	const boundsCoords = Config.gameBounds;
	const pointsArr = [];
	if (pointsArr.length > 0) {
		return pointsArr;
	}
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
};

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
			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);
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

