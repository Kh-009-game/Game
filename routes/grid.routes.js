const express = require('express');
// const locationController = require('../controllers/location-controller');
// const locationMiddlewares = require('../middleware/location-middlewares');
const EmptyLocation = require('../services/grid-service');

const router = express.Router();
// '/grid?lat=xxx&lng=xxx'
router.get('/', (req, res) => {
	const geoData = {
		lat: +req.query.lat,
		lng: +req.query.lng
	};
	const locCoords = EmptyLocation.calcNorthWestByPoint(geoData);
	const location = new EmptyLocation(locCoords);
	res.json(location);
});

// router.get('/bounds', (req, res) => {
// 	// const boundsCoords = [
// 	// 	{ lat: 49.890, lng: 36.098 },
// 	// 	{ lat: 50.112, lng: 36.249 },
// 	// 	{ lat: 49.883, lng: 36.442 }

// 	// ];
// 	// const boundsCoords = [
// 	// 	{ lat: 49.864, lng: 36.118 },
// 	// 	{ lat: 50.106, lng: 36.118 },
// 	// 	{ lat: 50.106, lng: 36.422 },
// 	// 	{ lat: 49.864, lng: 36.422 }
// 	// ];
// 	const boundsCoords = [
// 		{ lat: 49.850, lng: 36.118 },
// 		{ lat: 49.900, lng: 36.125 },
// 		{ lat: 49.970, lng: 36.140 },
// 		{ lat: 49.999, lng: 36.178 },
// 		{ lat: 50.050, lng: 36.190 },
// 		{ lat: 50.100, lng: 36.400 },
// 		{ lat: 49.970, lng: 36.360 },
// 		{ lat: 49.900, lng: 36.300 },
// 		{ lat: 49.850, lng: 36.220 }
// 	];
// 	const pointsArr = [];
// 	for (let i = 0; i < boundsCoords.length; i++) {
// 		let startPointLoc = EmptyLocation.createLocationByPoint(boundsCoords[i]);
// 		let endPointLoc;
// 		if (!boundsCoords[i + 1]) {
// 			startPointLoc = EmptyLocation.createLocationByPoint(boundsCoords[0]);
// 			endPointLoc = EmptyLocation.createLocationByPoint(boundsCoords[boundsCoords.length - 1]);
// 		} else {
// 			endPointLoc = EmptyLocation.createLocationByPoint(boundsCoords[i + 1]);
// 		}
// 		pointsArr.push(startPointLoc.northWest);
// 		while (true) {
// 			const direction = checkDirection(startPointLoc.northWest, endPointLoc.northWest);
// 			startPointLoc = assemblePoints(direction, startPointLoc, pointsArr);
// 			if (!startPointLoc) break;
// 		}
// 		pointsArr.push(endPointLoc.northWest);
// 	}

// 	// console.log(pointsArr);
// 	res.json(pointsArr);
// });

// function assemblePoints(direction, startPLoc, pointsArr) {
// 	switch (direction) {
// 		case 'toTheSouthWest': {
// 			const newLng = startPLoc.northWest.lng - 0.001;
// 			const newPoint = { lat: startPLoc.northWest.lat, lng: newLng };
// 			startPLoc = EmptyLocation.createLocationByPoint(newPoint);
// 			pointsArr.push(startPLoc.northWest);
// 			// south west
// 			pointsArr.push(startPLoc.getMapFeatureCoords()[1]);
// 			const newNorthWest = startPLoc.getMapFeatureCoords()[1];
// 			startPLoc.northWest = newNorthWest;
// 			return startPLoc;
// 		}
// 		case 'toTheSouthEast': {
// 			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);
// 			pointsArr.push(startPLoc.getMapFeatureCoords()[2]);
// 			// go to East
// 			const newLng = startPLoc.getMapFeatureCoords()[3].lng + 0.001;
// 			const newPoint = { lat: startPLoc.getMapFeatureCoords()[2].lat, lng: newLng };
// 			startPLoc = EmptyLocation.createLocationByPoint(newPoint);
// 			return startPLoc;
// 		}
// 		case 'toTheNorthWest': {
// 			const newLng = startPLoc.northWest.lng - 0.001;
// 			const newLat = startPLoc.northWest.lat + 0.001;
// 			const newPoint = { lat: newLat, lng: newLng };
// 			startPLoc = EmptyLocation.createLocationByPoint(newPoint);
// 			// north east
// 			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);
// 			pointsArr.push(startPLoc.northWest);

// 			return startPLoc;
// 		}
// 		case 'toTheNorthEast': {
// 			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);
// 			const newLng = startPLoc.getMapFeatureCoords()[3].lng + 0.001;
// 			const newLat = startPLoc.northWest.lat + 0.001;
// 			const newPoint = { lat: newLat, lng: newLng };
// 			startPLoc = EmptyLocation.createLocationByPoint(newPoint);

// 			pointsArr.push(startPLoc.northWest);
// 			return startPLoc;
// 		}
// 		case 'stop': {
// 			return false;
// 		}
// 		default:
// 			return false;
// 	}
// }
// function checkDirection(p1, p2) {
// 	let direction = '';
// 	if (p1.lat > p2.lat) {
// 		if (p1.lng > p2.lng) {
// 			direction = 'toTheSouthWest';
// 		} else if (p1.lng < p2.lng) {
// 			direction = 'toTheSouthEast';
// 		} else {
// 			direction = 'stop';
// 		}
// 	} else if (p1.lat < p2.lat) {
// 		if (p1.lng > p2.lng) {
// 			direction = 'toTheNorthWest';
// 		} else if (p1.lng < p2.lng) {
// 			direction = 'toTheNorthEast';
// 		} else {
// 			direction = 'stop';
// 		}
// 	} else {
// 		direction = 'stop';
// 	}
// 	return direction;
// }
router.get('/loc-info', (req, res) => {
	const emptyLoc = new EmptyLocation({
		lat: req.query.lat,
		lng: req.query.lng
	});
	emptyLoc.isHighlighted = req.query.highlighted;
	emptyLoc.isCurrent = req.query.current;
	res.render('loc-info', {
		location: emptyLoc,
		isAdmin: req.decoded.isAdmin
	});
});

// router.get('/checkOccupy', (req, res) => {
// 	const geoData = {
// 		lat: +req.query.lat,
// 		lng: +req.query.lng
// 	};

// 	const northWestBound = config.restrictOccupyingSettings.northWest;
// 	const distance = config.restrictOccupyingSettings.distance;

// 	class RestrictCoords {
// 		constructor(northWest, distance) {
// 			this.northWest = northWest;
// 			this.northEast = {
// 				lat: northWest.lat,
// 				lng: northWest.lng + distance.lng
// 			};
// 			this.southWest = {
// 				lat: northWest.lat - distance.lat,
// 				lng: northWest.lng
// 			};
// 			// this.southEast = {
// 			// 	lat: this.southWest.lat,
// 			// 	lng: this.northEast.lng
// 			// };
// 		}
// 	}
// 	const saveLocTerritory = new RestrictCoords(northWestBound, distance);
// 	// const polygonObjWhithinCanSaveLoc = this.defineBoundsOfATerritoryToBeOccupied();
// 	// const northWestLocCoords = location.northWest;
// 	const conditions = [
// 		geoData.lat >= saveLocTerritory.northWest.lat,
// 		geoData.lat <= saveLocTerritory.southWest.lat,
// 		geoData.lng >= saveLocTerritory.northEast.lng,
// 		geoData.lng <= saveLocTerritory.northWest.lng
// 	];
// 	let check = true;
// 	conditions.forEach((cond) => {
// 		if (cond) {
// 			check = false;
// 			// res.send(JSON.stringify({ available: false }));
// 		}
// 	});
// 	// res.send(JSON.stringify({ available: check, geo: geoData, saveLoc: saveLocTerritory }));
// 	res.json(check);
// 	// 	return check;
// });

module.exports = router;
