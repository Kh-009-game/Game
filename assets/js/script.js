'use strict';

class Game {
	constructor(options) {
		options = options || {};

		this.locInfoBlock = document.querySelector('.location-block');
		this.locInfoMenu = document.querySelector('.location-menu');
		this.clickedLocInfo = document.querySelector('.clicked-loc-info');
		this.currentLocInfo = document.querySelector('.current-loc-info');
		this.occupyFormContainer = document.querySelector('.form-container');
		this.showUserLocationsBtn = document.getElementById('show-user-location');
		this.centerUserLocationsBtn = document.getElementById('center-user-location');
		this.logOutBtn = document.getElementById('log-out');
		this.lifecycleBtn = document.getElementById('lifecycle-btn');

		this.occLocRenderedEvent = new CustomEvent('occloc-ready', {
			bubbles: true
		});
		this.gameArea = null;
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
		this.sidebar = document.querySelector('.sidebar');

		this.showUserLocationsBtn.addEventListener('click', (event) => {
			// let target = event.target;
			this.showAllUserLocations();
		});
		this.centerUserLocationsBtn.addEventListener('click', (event) => {
			// let target = event.target;
			this.centerMapByUserGeoData(undefined, undefined, 16);
			this.highlightCurrentLocation();
			this.renderHighlightedLocationTextInfo();
		});
		this.locInfoBlock.addEventListener('click', (event) => {
			let target = event.target;

			if (target.closest('#close-btn')) {
				target = target.closest('#close-btn');
				this.removeHighlight();
				this.locInfoBlock.classList.remove('show-clicked');
				this.locInfoBlock.classList.add('show-current');

				// close #clicked-loc-info
				return;
			}
			if (target.closest('#occupy-btn')) {
				target = target.closest('#occupy-btn');
				if (!this.currentLocation.isAllowed) {
					console.log('cannot be occupied');
				} else {
					this.showOccupationForm();
				}

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
			const isAllowed = this.checkPointContains(geoCoords);
			gridXHR.open('GET', `
				/api/locations/check-location?lat=${geoCoords.lat}
				&lng=${geoCoords.lng}
				${isAllowed ? '&isAllowed=true' : ''}
			`);
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
			const isAllowed = this.checkPointContains(geoCoords);
			gridXHR.open('GET', `
				/api/grid?lat=${geoCoords.lat}
				&lng=${geoCoords.lng}
				${isAllowed ? '&isAllowed=true' : ''}
			`);
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
		// this.lockLocMenu();
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

				return this.refreshUnderpasses();
			})

			.then(() => this.renderCurrentLocationInfo())
			.then(() => this.refreshHighlightedLocation())
			.then(() => {
				this.unlockLocMenu();
			})
			.catch((err) => {
				this.unlockLocMenu();
				this.errorHandler(err);
			});
	}

	refreshHighlightedLocation() {
		const locOld = this.highlightedLocation;
		if (!this.highlightedLocation) return Promise.resolve();
		return this.getLocationByCoords(this.highlightedLocation.northWest)
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
				} else if (locId) {
					this.highlightOccupiedLocation(location);
				} else {
					this.highlightEmptyLocation(location);
				}
				// if (this.isLocationUpdated(locOld, this.highlightedLocation)) {
				return this.renderHighlightedLocationTextInfo();
				// }
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
				if (userLocations.length === 0) {
					console.log('You have no locations');
					return;
				}
				userLocations.forEach((location) => {
					const points = [];
					location.mapFeatureCoords.forEach((point) => {
						points.push(new google.maps.LatLng(point.lat, point.lng));
					});
					// console.dir()
					this.locInfoBlock.classList.add('hide');
					// console.dir(northWestPoint);
					points.forEach((point) => {
						bounds.extend(point);
					});
				});
				this.map.fitBounds(bounds);

				if (userLocations.length === 1) {
					this.highlightOccupiedLocation(userLocations[0]);
					this.renderHighlightedLocationTextInfo();
				} else {
					this.locInfoMenu.classList.remove('open');
				}

				const zoom = this.map.getZoom();
				if (zoom > 15) {
					this.map.setZoom(15);
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

				if (this.currentLocation.isMaster && !this.currentLocation.dailyCheckin) {
					return this.doCheckin()
						.then(() => {
							this.currentLocation.dailyCheckin = true;
							console.log(`You checked in location #${this.currentLocation.locationId}`);
						});
				}

				return Promise.resolve();
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
		// this.currentLocation.isAllowed = currentLocation.isAllowed;
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

	// UNDERPASSES RENDER METHODS

	renderUnderpasses() {
		return this.getUnderpasses()
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
		return this.renderUnderpasses();
	}

	renderUnderpass(underpass) {
		const lineSymbol = {
			path: 'M 0,-1.5 0,-3.5',
			strokeOpacity: 0.5,
			scale: 2.5
		};

		const underpassPoly = new google.maps.Polyline({
			path: underpass.coords,
			icons: [{
				icon: lineSymbol,
				offset: '0',
				repeat: '15px'
			}],
			strokeColor: 'purple',
			strokeOpacity: 0
			// strokeWeight: 2
		});
		this.underpassesPolys.push(underpassPoly);
		underpassPoly.setMap(this.map);
	}

	initUnderpassCreation() {
		const locId = this.highlightedLocation.locationId;
		this.lockLocMenu();
		this.showUnderpassCreationForm()
			.then(() => this.getAvailableLocsForConnection(locId))
			.then((ids) => {
				this.availableForUnderpass = ids;
				this.highlightAvailableForUnderpass();
				this.initUnderpassCreationHandler();
				console.log(ids);
				this.unlockLocMenu();
			})
			.catch((err) => {
				this.unlockLocMenu();
				this.errorHandler(err);
			});
	}

	initUnderpassCreationHandler() {
		google.maps.event.removeListener(this.highlightGridMapListener);
		google.maps.event.removeListener(this.highlightFeatureMapListener);
		this.centerUserLocationsBtn.style.display = 'none';
		this.showUserLocationsBtn.style.display = 'none';
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

		this.lockLocMenu();
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
		this.centerUserLocationsBtn.style.display = 'block';
		this.showUserLocationsBtn.style.display = 'block';
		this.hideOccupationForm();
		this.clearMap();
		this.renderLocationsArray();
		this.refreshHighlightedLocation()
			.then(() => {
				this.unlockLocMenu();
			})
			.catch((err) => {
				this.unlockLocMenu();
				this.errorHandler(err);
			});
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

	updateCurrentEmptyLocation() {
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
		return this.updateHighlightedLocationTextInfo();
	}

	hightlightCurrentEmptyLocation() {
		return this.updateCurrentEmptyLocation()
			.then(() => {
				this.locInfoMenu.className = 'location-menu open';
				this.locInfoBlock.className = 'location-block show-clicked';
			});
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
		this.lockLocMenu();
		return this.updateHighlightedLocationTextInfo()
			.then(() => {
				this.locInfoMenu.className = 'location-menu open';
				this.locInfoBlock.className = 'location-block show-clicked';
				this.unlockLocMenu();
			});
	}

	updateHighlightedLocationTextInfo() {
		if (this.locInfoBlock.classList.contains('show-clicked')) {
			this.lockLocMenu();
		}
		return this.getLocInfoHTML(this.highlightedLocation)
			.then((response) => {
				this.clickedLocInfo.innerHTML = response;
				this.unlockLocMenu();
				return Promise.resolve();
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
		this.lockLocMenu();
		this.getLocOccupFormHTML()
			.then((response) => {
				this.occupyFormContainer.innerHTML = response;
				this.locInfoBlock.className = 'location-block show-form';
				this.unlockLocMenu();
				document.getElementById('loc-name-field').focus();
			})
			.catch((err) => {
				this.unlockLocMenu();
				this.errorHandler(err);
			});
	}

	showHighlightedOccupationForm() {
		this.lockLocMenu();
		this.getClickedLocOccupFormHTML()
			.then((response) => {
				this.occupyFormContainer.innerHTML = response;
				this.locInfoBlock.className = 'location-block show-form';
				this.unlockLocMenu();
				document.getElementById('loc-name-field').focus();
			})
			.catch((err) => {
				this.unlockLocMenu();
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
		this.lockLocMenu();
		this.occupyLocation(this.currentLocation)
			.then(() => {
				console.log('Congrats! You\'ve occupied the location!');
				this.hideOccupationForm();
			})
			.catch((err) => {
				this.unlockLocMenu();
				this.errorHandler(err);
				this.hideOccupationForm();
			});
	}

	occupyHighlightedLocation() {
		this.lockLocMenu();
		this.occupyLocation(this.highlightedLocation)
			.then(() => {
				this.hideOccupationForm();
			})
			.catch((err) => {
				this.unlockLocMenu();
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
		this.lockLocMenu();
		this.getLocOccupFormHTML(
			this.highlightedLocation
		)
			.then((response) => {
				this.occupyFormContainer.innerHTML = response;
				this.locInfoBlock.className = 'location-block';
				this.locInfoBlock.classList.add('show-form');
				this.unlockLocMenu();
				document.getElementById('loc-name-field').focus();
			})
			.catch((err) => {
				this.unlockLocMenu();
				this.errorHandler(err);
			});
	}

	editLocationInfoHandler(event) {
		event.preventDefault();
		const form = event.target;
		const locName = form['location-name'].value;
		const dailyMsg = form['daily-msg'].value;
		const locID = this.highlightedLocation.locationId;

		socket.emit('editLocationWS', { name: locName, dailyMessage: dailyMsg, locationId: locID });
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
		this.locInfoBlock.classList.add(locInfoClass);
		this.occupyFormContainer.innerHTML = '';
	}

	deleteLocHandler() {
		this.lockLocMenu();
		const confirmation = confirm(`Are you sure you want to delete ${this.highlightedLocation.locationName}?`);

		if (!confirmation) {
			this.unlockLocMenu();
			return;
		}

		this.deleteHighlightedLocation()
			.then(() => {
				// need refresh locations method
				this.unlockLocMenu();
				console.log('You\'ve deleted location');
			})
			.catch((err) => {
				this.unlockLocMenu();
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
		this.lockLocMenu();
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
				this.unlockLocMenu();
			})
			.catch((err) => {
				this.unlockLocMenu();
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
				}${
					location.isAllowed ? '&isAllowed=true' : ''
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
		this.setUserGeoData(coords);

		const oldHighLoc = this.highlightedLocation;
		const loc = this.currentLocation;
		if (loc === null || !this.checkIfLocContainsThePoint(coords, loc)) {
			console.log(1);
			this.renderCurrentLocationInfo()
				.then(() => {
					// this.renderCurrentUserMarker();
					if (this.highlightedLocation) {
						const currentIsHighlighted = (
							(this.currentLocation.northWest.lat === this.highlightedLocation.northWest.lat) &&
								(this.currentLocation.northWest.lng === this.highlightedLocation.northWest.lng)
						);
						if (currentIsHighlighted) {
							if (!this.currentLocation.locationId) {
								return this.updateCurrentEmptyLocation();
							}
							this.highlightOccupiedLocation(this.currentLocation);
							if (!oldHighLoc || this.isLocationUpdated(oldHighLoc, this.highlightedLocation)) {
								return this.updateHighlightedLocationTextInfo();
							}
						}
					}
				})
				.then(() => {
					this.renderCurrentUserMarker();
				})
				.catch((err) => {
					this.errorHandler(err);
				});
		} else {
			this.renderCurrentUserMarker();
		}
	}


	checkIfLocContainsThePoint(point, loc) {
		const latLng = new google.maps.LatLng(point.lat, point.lng);
		const locGeometry = new google.maps.Polygon({ paths: [loc.mapFeatureCoords] });
		if (google.maps.geometry.poly.containsLocation(latLng, locGeometry)) {
			return true;
		}
		return false;
	}
	showUserGeodata(coords) {
		this.setUserGeoData(coords);
		this.renderCurrentUserMarker();
		return this.renderCurrentLocationInfo()
			.then(() => {
				this.highlightCurrentLocation();
				return this.renderHighlightedLocationTextInfo();
			})
			.then(() => {
				this.locInfoMenu.classList.add('open');
				this.unlockUI();
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
		return notification;
	}

	// Running
	setupMessageElement(data) {
		const notifications = document.querySelector('.notification');
		notifications.classList.add('open');
		const removedItem = this.createMessageElement(data);
		setTimeout(() => {
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

	initLifecycleBtn() {
		if (!this.lifecycleBtn) return;

		this.lifecycleBtn.addEventListener('click', () => {
			this.emitLifecycle();
		});
	}

	emitLifecycle() {
		return new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();
			xhr.open('PUT', 'api/lifecycle/emit');
			xhr.send();
			xhr.onload = (e) => {
				const htmlXHR = e.srcElement;

				if (htmlXHR.status !== 200) {
					rej(htmlXHR.response);
				}

				res(htmlXHR.response);
			};
		})
			.then(() => {
				console.log('OK!');
			})
			.catch((err) => {
				this.errorHandler(err);
			});
	}

	checkPointContains(point) {
		const latLng = new google.maps.LatLng(point.lat, point.lng);
		return google.maps.geometry.poly.containsLocation(latLng, this.gameArea);
	}

	isLocationUpdated(locOld, locNew) {
		const result1 = this.deepDiff(locOld, locNew);
		const result2 = this.deepDiff(locNew, locOld);

		return result1 || result2;
	}

	deepDiff(obj1, obj2) {
		const keys = Object.keys(obj2);

		for (let i = 0, len = keys.length; i < len; i += 1) {
			const key = keys[i];
			if (typeof obj2[key] === 'object') {
				const result = this.deepDiff(obj1[key], obj2[key]);

				if (result === true) return result;
			}
			if (obj1[key] !== obj2[key]) {
				return true;
			}
		}
		return false;
	}

	lockUI() {
		document.documentElement.classList.add('locked');
	}

	unlockUI() {
		document.documentElement.classList.remove('locked');
	}

	lockLocMenu() {
		this.locInfoMenu.classList.add('locked');
	}

	unlockLocMenu() {
		this.locInfoMenu.classList.remove('locked');
	}

	initApp() {
		this.getGameBounds()
			.then((boundsCoords) => {
				this.gameArea = new google.maps.Polygon({
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

				gameBounds.setMap(this.map);

				this.renderOccupiedLocations();
				this.renderUnderpasses();
			})
			.catch((err) => {
				this.errorHandler(err);
			});
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
			game.setupMessageElement(data);
			game.refreshOccupiedLocations();
		});

		socket.on('lifecycle-started', () => {
			game.lockUI();
			game.setupMessageElement({
				text: 'Get ready for a new day...'
			});
		});

		socket.on('underpass-update', (data) => {
			game.setupMessageElement(data);
			game.refreshUnderpasses();
		});

		socket.on('daily-event', () => {
			if (game.currentLocation) {
				game.unlockUI();
			} else {
				game.initApp();
			}
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


		game.initApp();

		function initMapInteraction() {
			navigator.geolocation.getCurrentPosition((position) => {
				game.map.setZoom(16);
				game.map.setCenter({
					lat: position.coords.latitude,
					lng: position.coords.longitude
				});

				game.showUserGeodata({
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
			});
			// setInterval(() => {
			// 	game.refreshUserGeodata({
			// 		lat: game.userGeoData.lat,
			// 		lng: game.userGeoData.lng
			// 	});
			// }, 5000);

			game.highlightGridMapListener = map.addListener('click', (event) => {
				game.renderEmptyLocationInfo(event);
			});

			game.highlightFeatureMapListener = map.data.addListener('click', (event) => {
				game.renderHightlightedFeatureInfo(event);
			});
			document.removeEventListener('occloc-ready', initMapInteraction);
			game.initLifecycleBtn();
		}
	};
}
