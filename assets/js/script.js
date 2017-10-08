'use strict';

class Game {
	constructor(options) {
		// use template for output
		options = options || {};

		this.locInfoContainer = options.locInfoContainer || document.querySelector('.loc-info');
		this.locInfoBlock = options.locInfoContainer || document.querySelector('.location-block');
		this.locInfoMenu = options.locInfoContainer || document.querySelector('.location-menu');
		this.clickedLocInfo = options.locInfoContainer || this.locInfoContainer;
		this.currentLocInfo = options.locInfoContainer || this.locInfoContainer;
		this.occupyFormContainer = options.locInfoContainer || document.querySelector('.form-container');
		this.showUserLocationsBtn = document.getElementById('show-user-location');
		this.centerUserLocationsBtn = document.getElementById('center-user-location');
		this.logOutBtn = document.getElementById('log-out');

		this.occLocRenderedEvent = new CustomEvent('occloc-ready', {
			bubbles: true
		});
		this.occupyBtn = document.getElementById('occupy-btn');
		this.userMarker = null;
		this.map = options.map || null;
		this.mapBounds = options.mapBounds || null;
		this.userGeoData = null;
		this.currentLocation = null;
		this.currentLocationMapFeature = null;
		this.highlightedLocation = null;
		this.highlightedMapFeature = null;
		this.occupiedLocationsArray = [];
		this.occupiedLocationsMapFeatures = {};
		this.occupiedLocationsGroundOverlays = {};
		this.occupiedLocationsIcons = {};
		this.underpasses = [];
		this.underpassesPolys = [];

		this.showUserLocationsBtn.addEventListener('click', (event) => {
			// let target = event.target;
			this.showAllUserLocations();
		});
		this.centerUserLocationsBtn.addEventListener('click', (event) => {
			// let target = event.target;
			this.centerMapByUserGeoData(undefined, undefined, 16);
			this.highlightCurrentLocation();
		});
		this.locInfoContainer.addEventListener('click', (event) => {
			let target = event.target;

			if (target.closest('#close-btn')) {
				target = target.closest('#close-btn');
				this.removeHighlight();
				this.locInfoContainer.classList.remove('show-clicked');
				this.locInfoContainer.classList.add('show-current');

				// close #clicked-loc-info
				return;
			}
			if (target.closest('#occupy-btn')) {
				target = target.closest('#occupy-btn');
				// this.checkAbilityToOccupyLocation(this.currentLocation)
				// 	.then((isAble) => {
				// 		if (isAble) {
				// 			console.log('can be occupied');
				this.showOccupationForm();
				// } else {
				// 	// set pop-up or smth if cannot occupy
				// 	console.log('cannot be occupied, out of bounds');
				// }
				// });

				return;
			}
			if (target.closest('#occupy-click-btn')) {
				target = target.closest('#occupy-click-btn');
				this.showHighlightedOccupationForm();
				return;
			}
			if (target.closest('#delete-loc-btn')) {
				target = target.closest('#delete-loc-btn');
				this.deleteLocHandler();
				return;
			}
			if (target.closest('#edit-loc-btn')) {
				target = target.closest('#edit-loc-btn');
				this.showEditingLocForm();
				return;
			}
			if (target.closest('#money-btn')) {
				target = target.closest('#money-btn');
				this.takeDailyBank();
				return;
			}
			if (target.closest('#feed-btn')) {
				target = target.closest('#feed-btn');
				this.restorePopulation();
			}
			if (target.closest('#underpass-btn')) {
				target = target.closest('#feed-btn');
				this.initUnderpassCreation();
			}
		});
		this.occupyFormContainer.addEventListener('submit', (event) => {
			const form = event.target;
			if (form.getAttribute('name') === 'occup-form') {
				this.occupySubmitHandler(event);
			}
			if (form.getAttribute('name') === 'occup-clicked-form') {
				this.occupyHighlightedSubmitHandler(event);
			}
			if (form.getAttribute('name') === 'edit-loc-form') {
				this.editLocationInfoHandler(event);
			}
			if (form.getAttribute('name') === 'underpass-form') {
				this.submitUnderpassCreation(event);
			}
		});

		this.occupyFormContainer.addEventListener('reset', (event) => {
			const form = event.target;
			if (form.getAttribute('name') === 'occup-form') {
				this.hideOccupationForm();
			}
			if (form.getAttribute('name') === 'occup-clicked-form') {
				this.hideOccupationForm();
			}
			if (form.getAttribute('name') === 'edit-loc-form') {
				this.hideOccupationForm();
			}
			if (form.getAttribute('name') === 'underpass-form') {
				this.resetUnderpassCreationHandler();
			}
		});

		this.logOutBtn.addEventListener('click', (e) => {
			e.preventDefault();
			const logOutPromise = new Promise((res, rej) => {
				const xhr = new XMLHttpRequest();

				xhr.open('GET', '/user/logout');
				xhr.send();
				xhr.addEventListener('load', (e) => {
					const srcXHR = e.target;
					if (srcXHR.status !== 200) {
						rej(srcXHR.response);
					}
					window.location.replace(srcXHR.responseURL);
				});
			});
		});
	}

	// FEATURE CREATING METHODS	

	renderFullLocation(location) {
		const locId = location.locationId;

		if (!locId) return;

		this.occupiedLocationsMapFeatures[locId] = this.getAndRenderFeatureByLocObj(location);
		if (this.map.getZoom() < 16) {
			this.occupiedLocationsGroundOverlays[locId] = this.getAndRenderGroundOverlayByLocObj(location, null);
			this.occupiedLocationsIcons[locId] = this.getAndRenderIconByLocObj(location, this.map);
		} else {
			this.occupiedLocationsGroundOverlays[locId] = this.getAndRenderGroundOverlayByLocObj(location, this.map);
			this.occupiedLocationsIcons[locId] = this.getAndRenderIconByLocObj(location, null);
		}
	}

	getAndRenderFeatureByLocObj(location) {
		// remove old one feature if it is already present
		// if (this.occupiedLocationsMapFeatures[location.locationId]) {
		// 	this.map.data.remove(
		// 		this.occupiedLocationsMapFeatures[location.locationId]
		// 	);
		// }
		const properties = this.getMapFeatureProperties(location);

		const locationGeoObj = {
			type: 'Feature',
			id: location.locationId,
			properties,
			geometry: new google.maps.Data.Polygon([location.mapFeatureCoords])
		};

		return this.map.data.add(locationGeoObj);
	}

	getAndRenderGroundOverlayByLocObj(location, map) {
		const locId = location.locationId;
		if (!locId) return false;

		// if (this.occupiedLocationsGroundOverlays[locId]) {
		// 	this.occupiedLocationsGroundOverlays[locId].setMap(null);
		// }

		const groundOverlay = new google.maps.GroundOverlay(
			`/api/locations/${location.locationId}/svg?${new Date()}`,	{
				north: location.mapFeatureCoords[0].lat,
				south: location.mapFeatureCoords[1].lat,
				east: location.mapFeatureCoords[2].lng,
				west: location.mapFeatureCoords[0].lng
			});
		groundOverlay.setMap(map);

		return groundOverlay;
	}

	getAndRenderIconByLocObj(location, map) {
		const locId = location.locationId;
		if (!locId) return false;

		let icon;
		if (location.isMaster) {
			icon = 'img/icon_master.png';
		} else {
			icon = 'img/icon.png';
		}
		const marker = new google.maps.Marker({
			position: {
				lat: (location.mapFeatureCoords[0].lat + location.mapFeatureCoords[1].lat) / 2,
				lng: (location.mapFeatureCoords[2].lng + location.mapFeatureCoords[0].lng) / 2
			},
			icon
		});

		marker.setMap(map);

		marker.addListener('click', () => {
			this.centerMapByUserGeoData(marker.position.lat(), marker.position.lng(), 17);
			if (locId) {
				this.highlightOccupiedLocation(location);
				this.renderHighlightedLocationTextInfo();
			}
		});

		return marker;
	}


	get mapFeaturesStyles() {
		return {
			defaultStyles: {
				strokeColor: 'transparent ',
				fillColor: 'transparent',
				fillOpacity: 0.2,
				strokeWeight: 1,
				strokeOpacity: 1
			},
			ownedLocation: {
				fillColor: 'green'
			},
			occupiedLocation: {
				fillColor: 'grey'
			},
			profitLocation: {
			},
			highlightedEmptyLocation: {
				strokeColor: 'blue'
			},
			currentLocation: {
				strokeColor: 'crimson'
			}
		};
	}

	getMapFeatureProperties(location) {
		let featureProperties = this.mapFeaturesStyles.defaultStyles;
		featureProperties.info = {};
		featureProperties.info.isHighlighted = location.isHighlighted;
		featureProperties.info.isCurrent = location.isCurrent;

		if (location.masterId) {
			if (location.isMaster) {
				featureProperties = Object.assign(
					featureProperties,
					this.mapFeaturesStyles.ownedLocation
				);
				if (location.dailyBank !== 0) {
					featureProperties = Object.assign(
						featureProperties,
						this.mapFeaturesStyles.profitLocation
					);
				}
			} else {
				featureProperties = Object.assign(
					featureProperties,
					this.mapFeaturesStyles.occupiedLocation
				);
			}
			featureProperties.info.name = location.locationName;
			featureProperties.info.population = location.population;
			featureProperties.info.masterId = location.masterId;
		} else {
			featureProperties.info.name = 'Empty location';
		}

		if (location.isCurrent) {
			featureProperties = Object.assign(
				featureProperties,
				this.mapFeaturesStyles.currentLocation
			);
		}
		if (location.isHighlighted) {
			featureProperties = Object.assign(
				featureProperties,
				this.mapFeaturesStyles.highlightedEmptyLocation
			);
		}

		return featureProperties;
	}

	// GET LOCATIONS INFO FROM DB METHODS	

	getGameBounds() {
		return new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', '/api/bounds');
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const xhttp = e.target;
				if (xhttp.status === 200) {
					const response = JSON.parse(xhttp.response);
					console.log(response);
					const pointsArr = [];
					for (let i = 0; i < response.length; i++) {
						const coordsObj = {};
						coordsObj.lat = parseFloat(response[i].lat);
						coordsObj.lng = parseFloat(response[i].lng);
						pointsArr.push(coordsObj);
					}
					console.log(pointsArr);
					res(pointsArr);
				} else {
					rej(xhttp.response);
				}
			});
		});
	}
	// get ALL occupied locations short info from db
	getOccupiedLocations() {
		return new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', '/api/locations/');
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const srcXHR = e.target;
				if (srcXHR.status === 200) {
					res(JSON.parse(srcXHR.response));
				} else {
					rej(srcXHR.response);
				}
			});
		});
	}

	// get current location info (returns empty or occupied locations on the current point)

	getLocationByCoords(geoCoords) {
		return new Promise((res, rej) => {
			const gridXHR = new XMLHttpRequest();
			gridXHR.open('GET', `/api/locations/check-location?lat=${geoCoords.lat}&lng=${geoCoords.lng}`);
			gridXHR.send();
			gridXHR.onload = (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(JSON.parse(xhr.response));
			};
		});
	}

	getLocationInfoById(id) {
		return new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', `/api/locations/${id}`);
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const getLocationInfoXHR = e.srcElement;

				if (getLocationInfoXHR.status !== 200) {
					rej(getLocationInfoXHR.response);
				}
				res(JSON.parse(getLocationInfoXHR.response));
			});
		});
	}

	// get empty location coords from chosen point

	getGridByGeoCoords(geoCoords) {
		return new Promise((res, rej) => {
			const gridXHR = new XMLHttpRequest();
			gridXHR.open('GET', `/api/grid?lat=${geoCoords.lat}&lng=${geoCoords.lng}`);
			gridXHR.send();
			gridXHR.onload = (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(JSON.parse(xhr.response));
			};
		});
	}

	getUnderpasses() {
		return new Promise((res, rej) => {
			const gridXHR = new XMLHttpRequest();
			gridXHR.open('GET', '/api/underpasses');
			gridXHR.send();
			gridXHR.onload = (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(JSON.parse(xhr.response));
			};
		});
	}

	// RENDERING OF ALL OCCUPIED LOCATIONS

	renderOccupiedLocations() {
		this.getOccupiedLocations()
			.then((locArray) => {
				this.occupiedLocationsArray = locArray;
				this.renderLocationsArray();
				document.dispatchEvent(this.occLocRenderedEvent);
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	renderLocationsArray() {
		this.occupiedLocationsArray.forEach((location) => {
			this.renderFullLocation(location);
		});
	}

	refreshOccupiedLocations() {
		this.getOccupiedLocations()
			.then((locArray) => {
				console.dir(locArray);
				this.clearMap();
				locArray.forEach((location, i) => {
					location = this.getAndExtendLoadedLocationById(location);
					locArray[i] = location;
				});
				this.occupiedLocationsArray = locArray;

				this.occupiedLocationsArray.forEach((location) => {
					this.renderFullLocation(location);
				});

				return this.renderCurrentLocationInfo();
			})
			.then(() => this.refreshHighlightedLocation())
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	refreshHighlightedLocation() {
		this.getLocationByCoords(this.highlightedLocation.northWest)
			.then((location) => {
				this.removeHighlight();
				const locId = location.locationId;
				const lat = location.northWest.lat;
				const lng = location.northWest.lng;
				if (
					this.currentLocation.northWest.lat === lat &&
					this.currentLocation.northWest.lng === lng
				) {
					if (locId) {
						this.highlightOccupiedLocation(this.currentLocation);
					} else {
						this.hightlightCurrentEmptyLocation();
					}
					return this.renderHighlightedLocationTextInfo();
				}
				if (location.locationId) {
					this.highlightOccupiedLocation(location);
					return this.renderHighlightedLocationTextInfo();
				}
				this.highlightEmptyLocation(location);
				return this.renderHighlightedLocationTextInfo();
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	clearMap() {
		this.occupiedLocationsArray.forEach((location) => {
			const locId = location.locationId;
			this.map.data.remove(this.occupiedLocationsMapFeatures[locId]);
			this.occupiedLocationsGroundOverlays[locId].setMap(null);
			this.occupiedLocationsIcons[locId].setMap(null);
		});
		this.occupiedLocationsMapFeatures = {};
		this.occupiedLocationsGroundOverlays = {};
		this.occupiedLocationsIcons = {};
	}
	clearGroundOverlays() {
		this.occupiedLocationsArray.forEach((location) => {
			const locId = location.locationId;
			this.occupiedLocationsGroundOverlays[locId].setMap(null);
		});
	}
	clearIcons() {
		this.occupiedLocationsArray.forEach((location) => {
			const locId = location.locationId;
			this.occupiedLocationsIcons[locId].setMap(null);
		});
	}
	showGroundOverlays() {
		this.occupiedLocationsArray.forEach((location) => {
			const locId = location.locationId;
			this.occupiedLocationsGroundOverlays[locId].setMap(this.map);
		});
	}
	showIcons() {
		this.occupiedLocationsArray.forEach((location) => {
			const locId = location.locationId;
			this.occupiedLocationsIcons[locId].setMap(this.map);
		});
	}
	showUserIcons() {
		this.occupiedLocationsArray.forEach((location) => {
			if (location.isMaster) {
				const locId = location.locationId;
				this.occupiedLocationsIcons[locId].setMap(this.map);
			} else {
				const locId = location.locationId;
				this.occupiedLocationsIcons[locId].setMap(null);
			}
		});
	}

	// all user locations rendering method

	showAllUserLocations() {
		const userLocations = [];
		const bounds = new google.maps.LatLngBounds();
		console.dir(bounds);
		this.getOccupiedLocations()
			.then(() => {
				this.occupiedLocationsArray.forEach((location) => {
					if (location.isMaster) {
						userLocations.push(location);
					}
				});
				if (userLocations.length < 2) {
					console.log('only one loc');
				} else {
					userLocations.forEach((location) => {
						const northWest = location.northWest;
						console.log(`${northWest.lat} ${northWest.lng}`);
						const northWestPoint = new google.maps.LatLng(northWest.lat, northWest.lng);
						// console.dir()
						this.locInfoContainer.classList.add('hide');
						// console.dir(northWestPoint);
						bounds.extend(northWestPoint);
					});
					this.map.fitBounds(bounds);
				}

				this.showUserIcons();
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	// CURRENT LOCATION RENDER METHODS

	renderCurrentLocationInfo() {
		return this.getLocationByCoords({
			lat: this.userGeoData.lat,
			lng: this.userGeoData.lng
		})
			.then((currentLocation) => {
				console.log(currentLocation.northWest);
				if (currentLocation.isAllowed) {
					console.log(true);
				} else {
					console.log(false);
				}
				this.removeCurrentHighlight();
				if (!currentLocation.masterId) {
					currentLocation.locationName = 'Empty Location';
					this.renderCurrentEmptyLocation(currentLocation);
				} else {
					this.renderCurrentOccupiedLocation(currentLocation);
				}

				const promises = [
					this.renderCurrentLocationTextInfo()
				];

				if (this.currentLocation.isMaster && !this.currentLocation.dailyCheckin) {
					promises.push(this.doCheckin()
						.then(() => {
							this.currentLocation.dailyCheckin = true;
							console.log(`You checked in location #${this.currentLocation.locationId}`);
						})
					);
				}

				return Promise.all(promises);
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	renderCurrentOccupiedLocation(currentLocation) {
		const locId = currentLocation.locationId;
		this.currentLocation = this.getAndExtendLoadedLocationById(currentLocation);
		this.currentLocation.isCurrent = true;
		this.currentLocationMapFeature = this.getAndRenderFeatureByLocObj(
			this.currentLocation
		);
		this.occupiedLocationsMapFeatures[locId] = this.currentLocationMapFeature;
	}

	renderCurrentEmptyLocation(currentLocation) {
		this.currentLocation = currentLocation;
		this.currentLocation.isCurrent = true;
		this.currentLocationMapFeature = this.getAndRenderFeatureByLocObj(
			this.currentLocation
		);
	}

	highlightCurrentLocation() {
		const locId = this.currentLocation.locationId;
		if (locId) {
			this.highlightOccupiedLocation(this.currentLocation);
		} else {
			this.hightlightCurrentEmptyLocation();
		}
	}

	removeCurrentHighlight() {
		if (this.currentLocationMapFeature) {
			const currentLocId = this.currentLocationMapFeature.getId();
			let check = this.currentLocationMapFeature.getProperty('info').isHighlighted;

			if (currentLocId) {
				check = false;
				for (let i = 0, len = this.occupiedLocationsArray.length; i < len; i += 1) {
					if (this.occupiedLocationsArray[i].locationId === currentLocId) {
						check = true;
					}
				}
			}

			if (check) {
				this.currentLocation.isCurrent = undefined;
				const featureProps = this.getMapFeatureProperties(this.currentLocation);
				this.map.data.overrideStyle(
					this.currentLocationMapFeature,
					featureProps
				);
				this.currentLocationMapFeature.setProperty('info', featureProps.info);
			} else {
				this.map.data.remove(this.currentLocationMapFeature);
			}
		}
	}

	renderCurrentLocationTextInfo() {
		return this.getLocInfoHTML(this.currentLocation)
			.then((response) => {
				this.currentLocInfo.innerHTML = response;
				if (this.locInfoBlock.className === 'location-block') {
					this.locInfoBlock.className = 'location-block show-current';
					this.locInfoMenu.classList.add('open');
				}
			});
	}

	// UNDERPASSES RENDER METHODS

	renderUnderpasses() {
		this.getUnderpasses()
			.then((underpasses) => {
				this.underpasses = underpasses;
				this.underpasses.forEach((item) => {
					this.renderUnderpass(item);
				});
				console.log(underpasses);
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	clearUnderpasses() {
		this.underpassesPolys.forEach((underpassPoly) => {
			underpassPoly.setMap(null);
		});

		this.underpassesPolys = [];
	}

	refreshUnderpasses() {
		this.clearUnderpasses();
		this.renderUnderpasses();
	}

	renderUnderpass(underpass) {
		const underpassPoly = new google.maps.Polyline({
			path: underpass.coords,
			geodesic: true,
			strokeColor: '#999',
			strokeOpacity: 0.5,
			strokeWeight: 2
		});
		this.underpassesPolys.push(underpassPoly);
		underpassPoly.setMap(this.map);
	}

	initUnderpassCreation() {
		const locId = this.highlightedLocation.locationId;

		this.showUnderpassCreationForm()
			.then(() => this.getAvailableLocsForConnection(locId))
			.then((ids) => {
				this.availableForUnderpass = ids;
				this.highlightAvailableForUnderpass();
				this.initUnderpassCreationHandler();
				console.log(ids);
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	initUnderpassCreationHandler() {
		google.maps.event.removeListener(this.highlightGridMapListener);
		google.maps.event.removeListener(this.highlightFeatureMapListener);
		this.createUnderpassMapListener = this.map.data.addListener('click', (event) => {
			const feature = event.feature;
			if (!feature.getProperty('info').underpassAvailable) return;
			this.chooseUnderpassLocToId(feature.getId());
		});
	}

	submitUnderpassCreation(event) {
		event.preventDefault();
		const form = event.target;

		const locId1 = +form['loc-from-id'].value;
		const locId2 = +form['loc-to-id'].value;

		this.createUnderpass(locId1, locId2)
			.then(() => {
				this.resetUnderpassCreationHandler();
				this.refreshUnderpasses();
				console.log('Ok!');
			})
			.catch((err) => {
				this.resetUnderpassCreationHandler();
				this.errorHandler(err);
			});
	}

	createUnderpass(locId1, locId2) {
		return new Promise((res, rej) => {
			const body = {
				locIdFrom: locId1,
				locIdTo: locId2,
				userGeoData: this.userGeoData
			};
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('POST', 'api/underpasses/create');
			createLocationXHR.setRequestHeader('Content-Type', 'application/json');
			createLocationXHR.send(JSON.stringify(body));
			createLocationXHR.addEventListener('load', (e) => {
				const xhr = e.srcElement;
				console.log(xhr);
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res();
			});
		});
	}

	resetUnderpassCreationHandler() {
		this.highlightGridMapListener = this.map.addListener('click', (event) => {
			this.renderEmptyLocationInfo(event);
		});
		this.highlightGridMapListener = this.map.data.addListener('click', (event) => {
			this.renderHightlightedFeatureInfo(event);
		});
		this.map.data.addListener(this.highlightFeatureMapListener);
		google.maps.event.removeListener(this.createUnderpassMapListener);
		this.clearMap();
		this.refreshHighlightedLocation();
		this.renderLocationsArray();
	}

	chooseUnderpassLocToId(locToId) {
		this.highlightAvailableForUnderpass();
		document.getElementById('underpass-submit').disabled = false;

		this.map.data.overrideStyle(
			this.occupiedLocationsMapFeatures[locToId], {
				strokeOpacity: 1
			}
		);

		let location;
		this.occupiedLocationsArray.forEach((item) => {
			if (item.locationId === locToId) {
				location = item;
			}
		});

		document.getElementById('loc-to-container').innerHTML = location.locationName;
		document.getElementById('loc-to-id').value = locToId;
	}

	showUnderpassCreationForm() {
		return this.getUnderpassCreationForm()
			.then((form) => {
				this.occupyFormContainer.innerHTML = form;
				this.locInfoBlock.className = 'location-block show-form';
			});
	}

	getUnderpassCreationForm() {
		const locId = this.highlightedLocation.locationId;
		return new Promise((res, rej) => {
			const xhttpr = new XMLHttpRequest();
			xhttpr.open('GET', `/api/underpasses/create?locFromId=${locId}`);
			xhttpr.send();
			xhttpr.addEventListener('load', (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(xhr.response);
			});
		});
	}

	highlightAvailableForUnderpass() {
		this.availableForUnderpass.forEach((id) => {
			this.map.data.overrideStyle(
				this.occupiedLocationsMapFeatures[id], {
					strokeWeight: 3,
					strokeOpacity: 0.5,
					strokeColor: 'green'
				}
			);
			this.occupiedLocationsMapFeatures[id].setProperty('info', {
				underpassAvailable: true
			});
		});
	}

	getAvailableLocsForConnection(locId) {
		return new Promise((res, rej) => {
			const xhttpr = new XMLHttpRequest();
			xhttpr.open('GET', `/api/underpasses/available-locations?locFromId=${locId}`);
			xhttpr.send();
			xhttpr.addEventListener('load', (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(JSON.parse(xhr.response));
			});
		});
	}

	// HIGHLIGHTED LOCATION METHODS

	// occupied locations highlighting methods

	renderOccupiedLocationInfo(targetFeatureId) {
		this.getLocationInfoById(targetFeatureId)
			.then((clickedLocation) => {
				console.log(clickedLocation);
				this.highlightOccupiedLocation(clickedLocation);
				return this.renderHighlightedLocationTextInfo();
			});
	}

	highlightOccupiedLocation(clickedLocation) {
		this.removeHighlight();

		const locId = clickedLocation.locationId;

		this.highlightedMapFeature = this.map.data.getFeatureById(locId);
		this.highlightedLocation = this.getAndExtendLoadedLocationById(clickedLocation);
		this.highlightedLocation.isHighlighted = true;
		const featureProps = this.getMapFeatureProperties(this.highlightedLocation);
		this.map.data.overrideStyle(
			this.highlightedMapFeature,
			featureProps
		);
		this.highlightedMapFeature.setProperty('info', featureProps.info);
	}


	// current location highlighting method

	hightlightCurrentEmptyLocation() {
		this.removeHighlight();
		this.currentLocation.isHighlighted = true;
		this.highlightedLocation = this.currentLocation;
		this.highlightedMapFeature = this.currentLocationMapFeature;
		const featureProps = this.getMapFeatureProperties(this.currentLocation);
		this.map.data.overrideStyle(
			this.currentLocationMapFeature,
			featureProps
		);
		this.currentLocationMapFeature.setProperty('info', featureProps.info);
		return this.renderHighlightedLocationTextInfo();
	}

	// empty locations highlighting methods

	renderEmptyLocationInfo(event) {
		this.getGridByGeoCoords({
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		})
			.then((clickedLocation) => {
				console.log(clickedLocation);
				clickedLocation.locationName = 'Empty Location';
				this.highlightEmptyLocation(clickedLocation);
				return this.renderHighlightedLocationTextInfo();
			});
	}

	highlightEmptyLocation(clickedLocation) {
		this.removeHighlight();
		this.highlightedLocation = clickedLocation;
		clickedLocation.isHighlighted = true;
		this.highlightedMapFeature = this.getAndRenderFeatureByLocObj(
			clickedLocation
		);
	}

	removeHighlight() {
		if (this.highlightedMapFeature) {
			const highlightedLocId = this.highlightedMapFeature.getId();
			if (highlightedLocId || this.highlightedMapFeature.getProperty('info').isCurrent) {
				this.highlightedLocation.isHighlighted = undefined;
				const featureProps = this.getMapFeatureProperties(this.highlightedLocation);
				this.map.data.overrideStyle(
					this.highlightedMapFeature,
					featureProps
				);
				this.highlightedMapFeature.setProperty('info', featureProps.info);
			} else {
				this.map.data.remove(this.highlightedMapFeature);
			}
		}
		this.highlightedLocation = null;
		this.highlightedMapFeature = null;
	}

	renderHightlightedFeatureInfo(event) {
		if (event.feature.getProperty('info').isHighlighted) return;

		const targetFeatureId = event.feature.getId();

		if (targetFeatureId) {
			this.renderOccupiedLocationInfo(targetFeatureId);
		}
		if (event.feature.getProperty('info').isCurrent) {
			this.hightlightCurrentEmptyLocation();
		}
	}

	renderHighlightedLocationTextInfo() {
		return this.getLocInfoHTML(this.highlightedLocation)
			.then((response) => {
				this.clickedLocInfo.innerHTML = response;
				this.locInfoBlock.className = 'location-block show-clicked';
			});
	}

	// SEARCH LOCATION IN LOADED LOCATIONS ARRAY AND UPDATE

	getAndExtendLoadedLocationById(newLocData) {
		let location = {};
		this.occupiedLocationsArray.forEach((item) => {
			if (item.locationId === newLocData.locationId) {
				location = item;
			}
		});
		location = Object.assign(location, newLocData);
		return location;
	}

	// LOCATION INTERACTION METHODS	

	checkAbilityToOccupyLocation(location) {
		return new Promise((res, rej) => {
			const xhttpr = new XMLHttpRequest();
			xhttpr.open('GET', `/api/grid/checkOccupy?lat=${location.northWest.lat}&lng=${location.northWest.lng}`);
			xhttpr.send();
			xhttpr.addEventListener('load', (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(JSON.parse(xhr.response));
			});
		});
	}

	showOccupationForm() {
		this.getLocOccupFormHTML()
			.then((response) => {
				this.occupyFormContainer.innerHTML = response;
				this.locInfoBlock.className = 'location-block show-form';
				document.getElementById('loc-name-field').focus();
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	showHighlightedOccupationForm() {
		this.getClickedLocOccupFormHTML()
			.then((response) => {
				this.occupyFormContainer.innerHTML = response;
				this.locInfoBlock.className = 'location-block show-form';
				document.getElementById('loc-name-field').focus();
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	occupySubmitHandler(event) {
		event.preventDefault();
		const form = event.target;
		const locName = form['location-name'].value;
		const dailyMsg = form['daily-msg'].value;

		this.currentLocation.locationName = locName;
		this.currentLocation.dailyMessage = dailyMsg;

		this.occupyCurrentLocation();
	}

	occupyHighlightedSubmitHandler(event) {
		event.preventDefault();
		const form = event.target;
		const locName = form['location-name'].value;
		const dailyMsg = form['daily-msg'].value;

		this.highlightedLocation.locationName = locName;
		this.highlightedLocation.dailyMessage = dailyMsg;

		this.occupyHighlightedLocation();
	}

	occupyCurrentLocation() {
		this.occupyLocation(this.currentLocation)
			.then(() => {
				console.log('Congrats! You\'ve occupied the location!');
				this.hideOccupationForm();
			})
			.catch((err) => {
				this.errorHandler(err);
				this.hideOccupationForm();
			});
	}

	occupyHighlightedLocation() {
		this.occupyLocation(this.highlightedLocation)
			.then(() => {
				this.hideOccupationForm();
			})
			.catch((err) => {
				this.errorHandler(err);
				this.hideOccupationForm();
			});
	}

	occupyLocation(location) {
		return new Promise((res, rej) => {
			const body = {
				locationData: location,
				userGeoData: this.userGeoData
			};
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('POST', 'api/locations/create');
			createLocationXHR.setRequestHeader('Content-Type', 'application/json');
			createLocationXHR.send(JSON.stringify(body));
			createLocationXHR.addEventListener('load', (e) => {
				const xhr = e.srcElement;
				console.log(xhr);
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res();
			});
		});
	}

	showEditingLocForm() {
		this.locInfoBlock.className = 'location-block';
		this.locInfoBlock.classList.add('show-form');
		this.getLocOccupFormHTML(
			this.highlightedLocation
		)
			.then((response) => {
				this.occupyFormContainer.innerHTML = response;
				document.getElementById('loc-name-field').focus();
			});
	}

	editLocationInfoHandler(event) {
		event.preventDefault();
		const form = event.target;
		const locName = form['location-name'].value;
		const dailyMsg = form['daily-msg'].value;
		const locID = this.highlightedLocation.locationId;

		// error handling?
		socket.emit('editLocationWS', { locationName: locName, dailyMessage: dailyMsg, locationId: locID });
	}

	deleteLocation(location) {
		return new Promise((res, rej) => {
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('DELETE', `api/locations/${location.locationId}`);
			createLocationXHR.send();
			createLocationXHR.addEventListener('load', (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res();
			});
		});
	}

	hideOccupationForm() {
		const locInfoClass = this.highlightedLocation ? 'show-clicked' : 'show-current';
		this.locInfoBlock.className = 'location-block';
		this.locInfoContainer.classList.add(locInfoClass);
		this.occupyFormContainer.innerHTML = '';
	}

	deleteLocHandler() {
		const confirmation = confirm(`Are you sure you want to delete ${this.highlightedLocation.locationName}?`);

		if (!confirmation) return;

		this.deleteHighlightedLocation()
			.then(() => {
				// need refresh locations method
				console.log('You\'ve deleted location');
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	deleteHighlightedLocation() {
		return this.deleteLocation(this.highlightedLocation);
	}

	restorePopulation() {
		return new Promise((res, rej) => {
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('PUT', `api/locations/${this.highlightedLocation.locationId}/restore-population`);
			createLocationXHR.setRequestHeader('Content-Type', 'application/json');
			createLocationXHR.send();
			createLocationXHR.onload = (e) => {
				const xhr = e.srcElement;
				console.log(xhr);
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(xhr.response);
			};
		})
			.then(() => {
				this.highlightedLocation.loyalPopulation = this.highlightedLocation.population;
				this.highlightOccupiedLocation(this.highlightedLocation);
				return this.renderHighlightedLocationTextInfo();
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	doCheckin() {
		return new Promise((res, rej) => {
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('PUT', `api/locations/${this.currentLocation.locationId}/do-checkin`);
			createLocationXHR.setRequestHeader('Content-Type', 'application/json');
			createLocationXHR.send(JSON.stringify({
				userGeoData: {
					lat: this.userGeoData.lat,
					lng: this.userGeoData.lng
				}
			}));
			createLocationXHR.onload = (e) => {
				const xhr = e.srcElement;
				console.log(xhr);
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(xhr.response);
			};
		});
	}

	takeDailyBank() {
		return new Promise((res, rej) => {
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('PUT', `api/locations/${this.currentLocation.locationId}/get-bank`);
			createLocationXHR.setRequestHeader('Content-Type', 'application/json');
			createLocationXHR.send(JSON.stringify({
				userGeoData: {
					lat: this.userGeoData.lat,
					lng: this.userGeoData.lng
				}
			}));
			createLocationXHR.onload = (e) => {
				const xhr = e.srcElement;
				console.log(xhr);
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(xhr.response);
			};
		})
			.then(() => {
				this.currentLocation.dailyBank = 0;
				this.renderCurrentOccupiedLocation(this.currentLocation);
				return this.renderCurrentLocationTextInfo();
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	// GET TEMPLATES

	getLocOccupFormHTML(location) {
		return new Promise((res, rej) => {
			const url = location ?
				`/api/locations/${location.locationId}/edit` :
				'/api/locations/create';
			const xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.send();
			xhr.onload = (e) => {
				const htmlXHR = e.srcElement;

				if (htmlXHR.status !== 200) {
					rej(htmlXHR.response);
				}

				res(htmlXHR.response);
			};
		});
	}

	getClickedLocOccupFormHTML() {
		return new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', '/api/locations/create?clicked=true');
			xhr.send();
			xhr.onload = (e) => {
				const htmlXHR = e.srcElement;

				if (htmlXHR.status !== 200) {
					rej(htmlXHR.response);
				}

				res(htmlXHR.response);
			};
		});
	}

	getLocInfoHTML(location) {
		return new Promise((res, rej) => {
			let url = '/api';
			if (location.locationId) {
				url += `/locations/${location.locationId}/loc-info?${
					location.isCurrent ? 'current=true' : ''
				}${
					location.isCurrent && location.isHighlighted ? '&' : ''
				}${
					location.isHighlighted ? 'highlighted=true' : ''
				}`;
			} else {
				url += `/grid/loc-info?lat=${
					location.northWest.lat
				}&lng=${
					location.northWest.lng
				}&${
					location.isCurrent ? 'current=true' : ''
				}${
					location.isCurrent && location.isHighlighted ? '&' : ''
				}${
					location.isHighlighted ? 'highlighted=true' : ''
				}`;
			}
			const xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.send();
			xhr.onload = (e) => {
				const htmlXHR = e.srcElement;

				if (htmlXHR.status !== 200) {
					rej(htmlXHR.response);
				}

				res(htmlXHR.response);
			};
		});
	}

	// GOOGLE MAP AND HTML5 GEOLOCATION INTERACTION METHODS
	refreshUserGeodata(coords) {
		const locInfoClassList = this.locInfoBlock.className;
		this.setUserGeoData(coords);
		this.renderCurrentUserMarker();

		this.renderCurrentLocationInfo()
			.then(() => {
				if (this.highlightedLocation) {
					const currentIsHighlighted = (
						this.currentLocation.northWest.lat === this.highlightedLocation.northWest.lat &&
						this.currentLocation.northWest.lng === this.highlightedLocation.northWest.lng
					);
					if (currentIsHighlighted) {
						if (!this.currentLocation.locationId) {
							return this.hightlightCurrentEmptyLocation();
						}
						this.highlightOccupiedLocation(this.currentLocation);
						return this.renderHighlightedLocationTextInfo();
					}
				}
			})
			// .then(() => this.renderHighlightedLocationTextInfo())
			.then(() => {
				// do not change displaying element in loc-info;
				this.locInfoBlock.className = locInfoClassList === 'location-block' ?
					this.locInfoBlock.className :
					locInfoClassList;
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	centerMapByUserGeoData(latUser, lngUser, zoomUser) {
		const lat = latUser || this.userGeoData.lat;
		const lng = lngUser || this.userGeoData.lng;
		this.map.setZoom(zoomUser || 15);
		this.map.setCenter({ lat, lng });
	}

	renderCurrentUserMarker() {
		if (this.userMarker) {
			this.userMarker.setMap(null);
		}
		this.userMarker = new google.maps.Marker({
			position: {
				lat: this.userGeoData.lat,
				lng: this.userGeoData.lng
			},
			map: this.map,
			title: 'There you are!'
		});
	}

	updateMapBounds() {
		this.setMapBounds({
			northEast: {
				lat: this.map.getBounds().getNorthEast().lat(),
				lng: this.map.getBounds().getNorthEast().lng()
			},
			southWest: {
				lat: this.map.getBounds().getSouthWest().lat(),
				lng: this.map.getBounds().getSouthWest().lng()
			}
		});
	}

	setMapBounds(mapBounds) {
		this.mapBounds = mapBounds;
	}

	setUserGeoData(userCoord) {
		this.userGeoData = userCoord;
	}
	// The function creates a notification with the specified body and header.

	createMessageElement(data) {
		const notification = document.createElement('div');
		notification.classList.add('notification-item');
		notification.textContent = data.text;

		const notifications = document.querySelector('.notification');
		notifications.appendChild(notification);
	}

	// Running
	setupMessageElement(data) {
		const notifications = document.querySelector('.notification');
		notifications.classList.add('open');
		this.createMessageElement(data);
		setTimeout(() => {
			const removedItem = notifications.querySelector('.notification-item:first-child');
			removedItem.classList.add('remove');
			removedItem.addEventListener('animationend', () => {
				notifications.removeChild(removedItem);
			});
		}, 10000);
	}

	errorHandler(err) {
		this.setupMessageElement({
			text: err
		});
		console.log(err);
	}
}

function initMap() {
	const map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: { lat: 49.9891, lng: 36.2322 },
		clickableIcons: false,
		disableDefaultUI: true,
		styles: MAP_STYLES
	});


	window.onload = function () {
		const game = new Game({
			map,
			mapBounds: {
				northEast: {
					lat: map.getBounds().getNorthEast().lat(),
					lng: map.getBounds().getNorthEast().lng()
				},
				southWest: {
					lat: map.getBounds().getSouthWest().lat(),
					lng: map.getBounds().getSouthWest().lng()
				}
			}
		});

		socket.on('update', (data) => {
			// текст сообщения перенести в сокет.текст
			game.setupMessageElement(data);
			console.log('socketData', data);
			game.refreshOccupiedLocations();
			console.log(game.occupiedLocationsMapFeatures);
		});


		map.data.setStyle((feature) => {
			const defaultStyles = game.mapFeaturesStyles.defaultStyles;
			const strokeColor = feature.getProperty('strokeColor') || defaultStyles.strokeColor;
			const fillColor = feature.getProperty('fillColor') || defaultStyles.fillColor;
			const fillOpacity = feature.getProperty('fillOpacity') || defaultStyles.fillOpacity;
			const strokeWeight = feature.getProperty('strokeWeight') || defaultStyles.strokeWeight;
			const strokeOpacity = feature.getProperty('strokeOpacity') || defaultStyles.strokeOpacity;
			return /** @type {google.maps.Data.StyleOptions} */({
				fillColor,
				fillOpacity,
				strokeColor,
				strokeWeight,
				strokeOpacity
			});
		});

		document.addEventListener('occloc-ready', initMapInteraction);
		map.addListener('zoom_changed', () => {
			if (map.getZoom() < 16) {
				game.showIcons();
				game.clearGroundOverlays();
			} else {
				game.showGroundOverlays();
				game.clearIcons();
			}
		});

		game.renderOccupiedLocations();
		game.renderUnderpasses();

		game.getGameBounds()
			.then((boundsCoords) => {
				const gameArea = new google.maps.Polygon({
					path: boundsCoords,
					strokeColor: '#5B5B5B',
					strokeOpacity: 1.0,
					strokeWeight: 2,
					fillOpacity: 0
				});
				const gameBounds = new google.maps.Polyline({
					path: boundsCoords,
					geodesic: true,
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: 2
				});

				gameBounds.setMap(map);

				map.addListener('click', (e) => {
					if (google.maps.geometry.poly.containsLocation(e.latLng, gameArea)) {
						console.log('contains');
					} else {
						console.log('out of bounds');
					}
				});
			})
			.catch((err) => {
				this.errorHandler(err);
			});

		function initMapInteraction() {
			navigator.geolocation.getCurrentPosition((position) => {
				game.map.setZoom(16);
				game.map.setCenter({
					lat: position.coords.latitude,
					lng: position.coords.longitude
				});
			}, () => {
				// THERE HAVE TO BE CODE FOR TURNED OFF GEOLOCATION NOTIFICATION
				alert('Your geolocation is not working. Probably you forgot to turn it on. Please, turn on geolocation and give proper access to this app');
			});

			navigator.geolocation.watchPosition((position) => {
				game.refreshUserGeodata({
					lat: position.coords.latitude,
					lng: position.coords.longitude
				});
			}, () => {
				// THERE HAVE TO BE CODE FOR TURNED OFF GEOLOCATION NOTIFICATION
				alert('Your geolocation is not working. Probably you forgot to turn it on. Please, turn on geolocation and give proper access to this app');
			});

			game.highlightGridMapListener = map.addListener('click', (event) => {
				game.renderEmptyLocationInfo(event);
			});

			game.highlightFeatureMapListener = map.data.addListener('click', (event) => {
				game.renderHightlightedFeatureInfo(event);
			});
			document.removeEventListener('occloc-ready', initMapInteraction);
		}
	};
}
