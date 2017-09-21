'use strict';

// const socket = io();


class Game {
	constructor(options) {
		// use template for output
		options = options || {};

		this.locInfoContainer = options.locInfoContainer || document.getElementById('loc-info');
		this.clickedLocInfo = options.locInfoContainer || document.getElementById('clicked-loc-info');
		this.currentLocInfo = options.locInfoContainer || document.getElementById('current-loc-info');
		this.occupyFormContainer = options.locInfoContainer || document.getElementById('occupy-form');

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
		this.showUserLocationsBtn = document.getElementById('showUserLocationsButton');
		// this.gameBounds = options.gameBounds || this.getGameBounds(userDefinedBounds);

		this.showUserLocationsBtn.addEventListener('click', (event) => {
			// let target = event.target;
			this.showAllUserLocations();
		});
		this.locInfoContainer.addEventListener('click', (event) => {
			let target = event.target;

			if (target.closest('#hide-btn')) {
				target = target.closest('#btn-hide');
				this.locInfoContainer.classList.add('hide');
				// hide #loc-info
				return;
			}

			if (target.closest('#show-btn')) {
				target = target.closest('#show-btn');
				this.locInfoContainer.classList.remove('hide');

				// show #loc-info
				return;
			}
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
				this.checkAbilityToOccupyLocation(this.currentLocation)
					.then((isAble) => {
						if (isAble) {
							console.log('can be occupied');
							this.showOccupationForm();
						} else {
							// set pop-up or smth if cannot occupy
							console.log('cannot be occupied, out of bounds');
						}
					});
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
		});
		this.locInfoContainer.addEventListener('submit', (event) => {
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
			xhr.open('GET', '/api/grid/bounds');
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const xhttp = e.target;
				if (xhttp.status === 200) {
					const response = JSON.parse(xhttp.response);
					const pointsArr = [];
					for (let i = 0; i < response.length; i++) {
						pointsArr.push(response[i]);
					}
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

	// RENDERING OF ALL OCCUPIED LOCATIONS

	renderOccupiedLocations() {
		this.getOccupiedLocations()
			.then((locArray) => {
				this.occupiedLocationsArray = locArray;
				this.occupiedLocationsArray.forEach((location) => {
					this.renderFullLocation(location);
				});
				document.dispatchEvent(this.occLocRenderedEvent);
			})
			.catch((err) => {
				console.log(err);
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
				console.log(err);
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
				console.log(err);
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

	// all user locations rendering method

	showAllUserLocations() {
		const userLocations = [];
		const bounds = new google.maps.LatLngBounds();
		console.dir(bounds);
		// no need to send request!
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
			})
			.catch((err) => {
				console.log(err);
			});
	}

	// CURRENT LOCATION RENDER METHODS

	renderCurrentLocationInfo() {
		return this.getLocationByCoords({
			lat: this.userGeoData.lat,
			lng: this.userGeoData.lng
		})
			.then((currentLocation) => {
				console.log(currentLocation);
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
				console.log(err);
			});
	}

	renderCurrentOccupiedLocation(currentLocation) {
		this.currentLocation = this.getAndExtendLoadedLocationById(currentLocation);
		this.currentLocation.isCurrent = true;
		this.currentLocationMapFeature = this.getAndRenderFeatureByLocObj(
			this.currentLocation
		);
	}

	renderCurrentEmptyLocation(currentLocation) {
		this.currentLocation = currentLocation;
		this.currentLocation.isCurrent = true;
		this.currentLocationMapFeature = this.getAndRenderFeatureByLocObj(
			this.currentLocation
		);
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
				if (this.locInfoContainer.className === 'loc-info') {
				    this.locInfoContainer.className = 'loc-info show-current';
				}
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
				console.log(`click${clickedLocation}`);
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

	renderHighlightedLocationTextInfo() {
		return this.getLocInfoHTML(this.highlightedLocation)
			.then((response) => {
				this.clickedLocInfo.innerHTML = response;
				this.locInfoContainer.className = 'loc-info show-clicked';
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
				this.locInfoContainer.className = 'loc-info show-form';
				document.getElementById('loc-name-field').focus();
			})
			.catch((err) => {
				console.log(err);
			});
	}

	showHighlightedOccupationForm() {
		this.getClickedLocOccupFormHTML()
			.then((response) => {
				this.occupyFormContainer.innerHTML = response;
				this.locInfoContainer.className = 'loc-info show-form';
				document.getElementById('loc-name-field').focus();
			})
			.catch((err) => {
				console.log(err);
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

	// occupyResetHandler(event) {
	// 	event.preventDefault();
	// 	const form = event.target;
	// 	const locName = form['location-name'].value;
	// 	const dailyMsg = form['daily-msg'].value;

	// 	this.currentLocation.locationName = locName;
	// 	this.currentLocation.dailyMessage = dailyMsg;

	// 	this.occupyCurrentLocation();
	// }

	occupyCurrentLocation() {
		this.occupyLocation(this.currentLocation)
			.then(() => {
				console.log('Congrats! You\'ve occupied the location!');
				this.hideOccupationForm();
			})
			.catch((err) => {
				console.log(err);
			});
	}

	occupyHighlightedLocation() {
		this.occupyLocation(this.highlightedLocation)
			.then(() => {
				alert('Congrats! You\'ve occupied the location!');
				this.hideOccupationForm();
			})
			.catch((err) => {
				console.log(err);
			});
	}

	occupyLocation(location) {
		return new Promise((res, rej) => {
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('POST', 'api/locations/create');
			createLocationXHR.setRequestHeader('Content-Type', 'application/json');
			createLocationXHR.send(JSON.stringify(location));
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
	 	this.locInfoContainer.className = 'loc-info';
	 	this.locInfoContainer.classList.add('show-form');
	 	this.getLocOccupFormHTML(
	 		this.highlightedLocation
	 	)
			.then((response) => {
				this.occupyFormContainer.innerHTML = response;
				document.getElementById('loc-name-field').focus();
			});
	 }

	// editLocationInfoHandler(event) {
	// 	event.preventDefault();
	// 	const form = event.target;
	// 	const locName = form['location-name'].value;
	// 	const dailyMsg = form['daily-msg'].value;
	// 	const location = form['daily-msg'].value;

	// 	this.currentLocation.locationName = locName;
	// 	this.currentLocation.dailyMessage = dailyMsg;

	// 	this.occupyCurrentLocation();
	// }

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
		this.locInfoContainer.className = 'loc-info';
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
				console.log(err);
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
				console.log(err);
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
				console.log(err);
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
		const locInfoClassList = this.locInfoContainer.className;
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
				this.locInfoContainer.className = locInfoClassList === 'loc-info' ?
					this.locInfoContainer.className :
					locInfoClassList;
			})
			.catch((err) => {
				console.log(err);
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
		const type = data.type;
		const container = document.createElement('div');
		let typeClass;
		if (type === 'msgCreateLoc') {
			typeClass = 'create-loc-msg';
		} else if (type === 'msgDeleteLoc') {
			typeClass = 'del-loc-msg';
		} else {
			typeClass = 'update-loc-msg';
		}
		container.innerHTML = `<div class="my-message"> 
	    <div class="my-message-title ${typeClass}"> Notification </div> 
	    <div class="my-message-body"> ${data.text} </div> 
	  </div>`;
		return container.firstChild;
	}

	// Running
	setupMessageElement(data) {
		const messageElem = this.createMessageElement(data);
		document.body.appendChild(messageElem);
		setTimeout(() => {
			messageElem.parentNode.removeChild(messageElem);
		}, 10000);
	}
}

function initMap() {
	const map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: { lat: 49.9891, lng: 36.2322 },
		clickableIcons: false,
		styles: [
			{
				featureType: 'water',
				elementType: 'geometry.fill',
				stylers: [
					{
						color: '#d3d3d3'
					}
				]
			},
			{
				featureType: 'transit',
				stylers: [
					{
						color: '#808080'
					},
					{
						visibility: 'off'
					}
				]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.stroke',
				stylers: [
					{
						visibility: 'on'
					},
					{
						color: '#b3b3b3'
					}
				]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.fill',
				stylers: [
					{
						color: '#ffffff'
					}
				]
			},
			{
				featureType: 'road.local',
				elementType: 'geometry.fill',
				stylers: [
					{
						visibility: 'on'
					},
					{
						color: '#ffffff'
					},
					{
						weight: 1.8
					}
				]
			},
			{
				featureType: 'road.local',
				elementType: 'geometry.stroke',
				stylers: [
					{
						color: '#d7d7d7'
					}
				]
			},
			{
				featureType: 'poi',
				elementType: 'geometry.fill',
				stylers: [
					{
						visibility: 'on'
					},
					{
						color: '#ebebeb'
					}
				]
			},
			{
				featureType: 'administrative',
				elementType: 'geometry',
				stylers: [
					{
						color: '#a7a7a7'
					}
				]
			},
			{
				featureType: 'road.arterial',
				elementType: 'geometry.fill',
				stylers: [
					{
						color: '#ffffff'
					}
				]
			},
			{
				featureType: 'road.arterial',
				elementType: 'geometry.fill',
				stylers: [
					{
						color: '#ffffff'
					}
				]
			},
			{
				featureType: 'landscape',
				elementType: 'geometry.fill',
				stylers: [
					{
						visibility: 'on'
					},
					{
						color: '#efefef'
					}
				]
			},
			{
				featureType: 'road',
				elementType: 'labels.text.fill',
				stylers: [
					{
						color: '#696969'
					}
				]
			},
			{
				featureType: 'administrative',
				elementType: 'labels.text.fill',
				stylers: [
					{
						visibility: 'on'
					},
					{
						color: '#737373'
					}
				]
			},
			{
				featureType: 'poi',
				elementType: 'labels.icon',
				stylers: [
					{
						visibility: 'off'
					}
				]
			},
			{
				featureType: 'poi',
				elementType: 'labels',
				stylers: [
					{
						visibility: 'off'
					}
				]
			},
			{
				featureType: 'road.arterial',
				elementType: 'geometry.stroke',
				stylers: [
					{
						color: '#d6d6d6'
					}
				]
			},
			{
				featureType: 'road',
				elementType: 'labels.icon',
				stylers: [
					{
						visibility: 'off'
					}
				]
			},
			{},
			{
				featureType: 'poi',
				elementType: 'geometry.fill',
				stylers: [
					{
						color: '#dadada'
					}
				]
			}
		]
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

		game.getGameBounds()
			.then((resArray) => {
				const gameBounds = new google.maps.Polyline({
					path: resArray,
					geodesic: true,
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: 2
				});

				gameBounds.setMap(map);
			})
			.catch((err) => {
				console.log(err);
			});

		setTimeout(() => {
			game.renderOccupiedLocations();
		}, 5000);

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

			// setTimeout(() => {
			// 	game.refreshUserGeodata({
			// 		lat: game.userGeoData.lat,
			// 		lng: game.userGeoData.lng
			// 	});
			// }, 5000);

			map.addListener('click', (event) => {
				game.renderEmptyLocationInfo(event);
			});

			map.data.addListener('click', (event) => {
				if (event.feature.getProperty('info').isHighlighted) return;

				const targetFeatureId = event.feature.getId();

				if (targetFeatureId) {
					game.renderOccupiedLocationInfo(targetFeatureId);
					// .catch((err) => {
					// 	console.log(err);
					// });
				}
				if (event.feature.getProperty('info').isCurrent) {
					game.hightlightCurrentEmptyLocation();
				}
			});
			document.removeEventListener('occloc-ready', initMapInteraction);
		}
	};
}
