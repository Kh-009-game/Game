'use strict';

const express = require('express');
const EmptyLocation = require('../models/emptyLocation');
const Config = require('../config');

const router = express.Router();
// '/grid?lat=xxx&lng=xxx'
router.get('/', (req, res) => {
	const geoData = {
		lat: +req.query.lat,
		lng: +req.query.lng
	};
	const location = new EmptyLocation(geoData);
	res.json(location);
});

router.get('/bounds', (req, res) => {
	// const bounds = req.body.coords;
	// const bounds = Config.gameBounds;
	// const directions = []
	// for (let i = 0; i < bounds.length; i++) {
	// const startPointLoc = new EmptyLocation(bounds[i]);
	// const startNorthW = startPointLoc.northWest;
	// const endPointLoc = new EmptyLocation(bounds[i + 1]);
	// const endNorthW = endPointLoc.northWest;
	// let case = endNorthW - startNorthW;

	// const directions = {
	// 	'toTheSouthWest':
	// 	[[startNorthW.lng -= 0.01], []],
	// 	'toTheSouthEast':,
	// 	'toTheNorthWest':,
	// 	'toTheNorthEast':
	// }
	// }
	// let startPointLoc = new EmptyLocation({ lat: 50.112, lng: 36.249 });
	// console.log(`startP!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   ${startPointLoc.northWest.lng}`);
	// const endPointLoc = new EmptyLocation({ lat: 49.890, lng: 36.098 });
	// let startPointLoc = new EmptyLocation({ lat: 49.883, lng: 36.442 });
	// const endPointLoc = new EmptyLocation({ lat: 50.112, lng: 36.249 });
	// let startPointLoc = new EmptyLocation({ lat: 50.112, lng: 36.249 });
	// const endPointLoc = new EmptyLocation({ lat: 49.883, lng: 36.442 });
	// let startPointLoc = new EmptyLocation({ lat: 49.890, lng: 36.098 });
	// const endPointLoc = new EmptyLocation({ lat: 50.112, lng: 36.249 });
	// let startPointLoc = new EmptyLocation({ lat: 49.890, lng: 36.098 });
	// const endPointLoc = new EmptyLocation({ lat: 49.883, lng: 36.442 });
	const boundsCoords = [
		{ lat: 49.890, lng: 36.098 },
		{ lat: 50.112, lng: 36.249 },
		{ lat: 49.883, lng: 36.442 }

	];

	const pointsArr = [];
	for (let i = 0; i < boundsCoords.length; i++) {
		let startPointLoc = new EmptyLocation(boundsCoords[i]);
		let endPointLoc;
		if (!boundsCoords[i + 1]) {
			startPointLoc = new EmptyLocation(boundsCoords[0]);
			endPointLoc = new EmptyLocation(boundsCoords[boundsCoords.length - 1]);
		} else {
			endPointLoc = new EmptyLocation(boundsCoords[i + 1]);
		}


		pointsArr.push(startPointLoc.northWest);
		// console.dir(pointsArr);
		// let check = 0;
		// while (startPointLoc.northWest.lat !== endPointLoc.northWest.lat) {

		while (true) {
			const direction = checkDirection(startPointLoc.northWest, endPointLoc.northWest);
			// let startPointLoc = boundsCoords[i];
			startPointLoc = assemblePoints(direction, startPointLoc, pointsArr);
			// startPointLoc = assemblePoints('toTheSouthWest', startPointLoc, pointsArr);
			if (!startPointLoc) break;
		// console.log(`47 ${startPointLoc.northWest.lng}`);
		// check += 1;
		// console.log(`length${pointsArr.length}`);
		// if (check >= 1000) break;
		}
		pointsArr.push(endPointLoc.northWest);
	}

	// console.log(pointsArr);
	res.json(pointsArr);
});

function assemblePoints(direction, startPLoc, pointsArr) {
	// const pointsArr = [];
	// !!! pointsArr.push(startPLoc.northWest);
	switch (direction) {
		case 'toTheSouthWest': {
			const newLng = startPLoc.northWest.lng - 0.001;
			const newPoint = { lat: startPLoc.northWest.lat, lng: newLng };
			startPLoc = new EmptyLocation(newPoint);
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
			startPLoc = new EmptyLocation(newPoint);
			// pointsArr.push(startPLoc.northWest);
			// // south west
			// pointsArr.push(startPLoc.getMapFeatureCoords()[1]);
			// const newNorthWest = startPLoc.getMapFeatureCoords()[1];
			// startPLoc.northWest = newNorthWest;

			return startPLoc;
		}
		case 'toTheNorthWest': {
			const newLng = startPLoc.northWest.lng - 0.001;
			const newLat = startPLoc.northWest.lat + 0.001;
			const newPoint = { lat: newLat, lng: newLng };
			startPLoc = new EmptyLocation(newPoint);
			// north east
			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);
			pointsArr.push(startPLoc.northWest);
			// const newNorthWest = startPLoc.getMapFeatureCoords()[1];
			// startPLoc.northWest = newNorthWest;

			return startPLoc;
		}
		case 'toTheNorthEast': {
			const newLng = startPLoc.getMapFeatureCoords()[3].lng + 0.001;
			const newLat = startPLoc.northWest.lat + 0.001;
			const newPoint = { lat: newLat, lng: newLng };
			startPLoc = new EmptyLocation(newPoint);

			pointsArr.push(startPLoc.northWest);
			// north East
			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);

			// const newNorthWest = startPLoc.getMapFeatureCoords()[1];
			// startPLoc.northWest = newNorthWest;

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
router.get('/loc-info', (req, res) => {
	const emptyLoc = new EmptyLocation({
		lat: req.query.lat,
		lng: req.query.lng
	});
	// const bounds = config.userBounds;

	// const conditions = [
	// 	emptyLoc.lat >= bounds[0].lat,
	// 	emptyLoc.lat <= bounds[4].lat,
	// 	emptyLoc.lng >= bounds[2].lng,
	// 	emptyLoc.lng <= bounds[0].lng
	// ];
	// // do for Each!!!
	// let isAllowed = true;
	// conditions.forEach((cond) => {
	// 	if(cond) {
	// 		isAllowed = false;

	// 	}
	// })
	// emptyLoc.isAllowed = isAllowed;
	emptyLoc.isHighlighted = req.query.highlighted;
	emptyLoc.isCurrent = req.query.current;
	res.render('loc-info', {
		location: emptyLoc,
		isAdmin: req.decoded.isAdmin
	});
});

router.get('/checkOccupy', (req, res) => {
	const geoData = {
		lat: +req.query.lat,
		lng: +req.query.lng
	};

	const northWestBound = Config.restrictOccupyingSettings.northWest;
	const distance = Config.restrictOccupyingSettings.distance;

	class RestrictCoords {
		constructor(northWest, distance) {
			this.northWest = northWest;
			this.northEast = {
				lat: northWest.lat,
				lng: northWest.lng + distance.lng
			};
			this.southWest = {
				lat: northWest.lat - distance.lat,
				lng: northWest.lng
			};
			// this.southEast = {
			// 	lat: this.southWest.lat,
			// 	lng: this.northEast.lng
			// };
		}
	}
	const saveLocTerritory = new RestrictCoords(northWestBound, distance);
	// const polygonObjWhithinCanSaveLoc = this.defineBoundsOfATerritoryToBeOccupied();
	// const northWestLocCoords = location.northWest;
	const conditions = [
		geoData.lat >= saveLocTerritory.northWest.lat,
		geoData.lat <= saveLocTerritory.southWest.lat,
		geoData.lng >= saveLocTerritory.northEast.lng,
		geoData.lng <= saveLocTerritory.northWest.lng
	];
	let check = true;
	conditions.forEach((cond) => {
		if (cond) {
			check = false;
			// res.send(JSON.stringify({ available: false }));
		}
	});
	// res.send(JSON.stringify({ available: check, geo: geoData, saveLoc: saveLocTerritory }));
	res.json(check);
	// 	return check;
});

module.exports = router;
