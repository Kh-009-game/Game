const EmptyLocation = require('./grid-service');
const Config = require('../config');
// const Location = require('../models/location-orm');
// const sequelize = require('./orm-service');
const Bounds = require('../models/bounds-orm');

let bounds = [];
module.exports.getGameBounds = function () {
	if (bounds.length > 0) {
		return new Promise((res, rej) => {
			console.log('return saved bounds');
			res(bounds);
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

// return Bounds.findAll({ where: { figure_id: 1 } })
// 	.then((points) => {
// let calculatedBounds = [];
// if (calculatedBounds.length === 0) {
// 	// Config.calculatedBounds = calcGameBounds();
// 	calculatedBounds = calcGameBounds();
// let pathLength = 0;
// while (true) {
// 	let k = 100;
// 	const bulkArr = [];
// 	for (let i = 0; i <= k; i++) {
// 		const valuesObj = {};
// 		valuesObj.figure_id = 1;
// 		valuesObj.lat = pointsArr[i].lat;
// 		valuesObj.lng = pointsArr[i].lng;
// 		bulkArr.push(valuesObj);
// 	}
// 	Bounds.bulkCreate(bulkArr)
// 		.then(() => console.log('done!'))
// 		.catch(err => console.log(err));

// 	pathLength += k;
// 	if (k >= pointsArr.length - pathLength) {
// 		k = pathLength;
// 	} else if (pathLength >= pointsArr.length) {
// 		break;
// 	}
// }
// 	return calculatedBounds;
// }
// return calculatedBounds;
// 	const boundsArr = [];
// 	for (let i = 0; i < points.length; i++) {
// 		console.log(points[i].dataValues);
// 		const coordsObj = {};
// 		coordsObj.lat = points[i].dataValues.lat;
// 		coordsObj.lng = points[i].dataValues.lng;
// 		boundsArr.push(coordsObj);
// 	}
// 	return boundsArr;
// })
// .catch((err) => {
// 	console.log(`11bService${err}`);
// });
// };
// module.exports.validateLocation = function (northWest) {
// 	const bounds = getGameBounds();
// 	for (let i = 0; i < bounds.length; i++) {
// 		if (Math.abs(bounds[i].lat - northWest.lat)) {}
// 	}
// };
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
		// saveToDb(startPointLoc.northWest, 1);
		while (true) {
			const direction = checkDirection(startPointLoc.northWest, endPointLoc.northWest);
			startPointLoc = assemblePoints(direction, startPointLoc, pointsArr);
			if (!startPointLoc) break;
		}
		pointsArr.push(endPointLoc.northWest);
		// saveToDb(endPointLoc.northWest, 1);
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
			// saveToDb(startPLoc.getMapFeatureCoords()[3], 1);
			pointsArr.push(startPLoc.getMapFeatureCoords()[2]);
			// saveToDb(startPLoc.getMapFeatureCoords()[2], 1);
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
			// saveToDb(startPLoc.getMapFeatureCoords()[3], 1);
			pointsArr.push(startPLoc.northWest);
			// saveToDb(startPLoc.northWest, 1);

			return startPLoc;
		}
		case 'toTheNorthEast': {
			pointsArr.push(startPLoc.getMapFeatureCoords()[3]);
			// saveToDb(startPLoc.getMapFeatureCoords()[3], 1);
			const newLng = startPLoc.getMapFeatureCoords()[3].lng + 0.001;
			const newLat = startPLoc.northWest.lat + 0.001;
			const newPoint = { lat: newLat, lng: newLng };
			startPLoc = EmptyLocation.createLocationByPoint(newPoint);

			pointsArr.push(startPLoc.northWest);
			// saveToDb(startPLoc.northWest, 1);
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

