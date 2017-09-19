const express = require('express');
const EmptyLocation = require('../models/emptyLocation');
const config = require('../config');

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

router.post('/bounds', (req, res) => {
	const userDefinedBounds = req.body.coords;
	
})

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

	const northWestBound = config.restrictOccupyingSettings.northWest;
	const distance = config.restrictOccupyingSettings.distance;

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
