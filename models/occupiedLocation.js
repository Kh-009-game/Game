const EmptyLocation = require('./emptyLocation');

class OccupiedLocation extends EmptyLocation {
	constructor(locationData) {
		super(locationData.northWest);

		this.masterId = locationData.userId;
		this.masterName = locationData.userName;
		this.locationId = locationData.locationId || null;
		this.population = locationData.population || 10;
		this.dailyBank = locationData.dailyBank || 0;
		this.loyalPopulation = locationData.loyalPopulation || 10;
		this.dailyCheckin = locationData.dailyCheckin === undefined ? true : locationData.dailyCheckin;
		this.creationDate = locationData.creationDate || new Date().toISOString();
		this.locationName = locationData.locationName || null;
		this.dailyMessage = locationData.dailyMessage || null;
	}

	saveLocation() {
		return global.db.tx(t => t.batch([
			t.none(
				`insert into locations2 (
						lat, lng, population, daily_bank, 
						creation_date, loc_name, daily_msg
					)
					values(
					${this.northWest.lat},
					${this.northWest.lng},
					${this.population},
					${this.dailyBank},
					'${this.creationDate}',
					'${this.locationName.split('\'').join('\'\'')}',
					'${this.dailyMessage.split('\'').join('\'\'')}'
					)`
			),
			t.tx(t1 => t1.one(
				`select loc_id from locations2																			 
						where locations2.lat = ${this.northWest.lat} 
						and locations2.lng = ${this.northWest.lng}`
			)
				.then((data) => {
					this.locationId = data.loc_id;
					return t1.tx(t2 => t2.batch([
						t2.none(
							`insert into master_location2 (user_id, loc_id, loyal_popul)
									values(
										${this.masterId},
										${this.locationId},
										${this.loyalPopulation}
									)`
						),
						t2.none(
							`insert into location_checkin (loc_id, checkin_date)
							values(
								${this.locationId},
								now()
							)`
						)
					]));
				})
			)]));
	}

	editLocation() {
		return global.db(
			`update locations2
			 set loc_name = '${this.locationName}',
						daily_msg = '${this.dailyMessage}'
			 where loc_id = ${this.locationId}`
		);
	}

	doCheckin() {
		return global.db.none(
			`update location_checkin
			 set checkin_date = now()
			 where loc_id = ${this.locationId}`
		);
	}

	takeDailyBank() {
		return global.db.tx(t => t.batch([
			t.none(
				`update users
				 set cash = cash + locations2.daily_bank
				 from locations2, master_location2
				 where locations2.loc_id = master_location2.loc_id and locations2.loc_id = ${this.locationId} and id = ${this.masterId}`
			),
			t.none(
				`update locations2
				 set daily_bank = 0
				 where loc_id = ${this.locationId}`
			)
		]));
	}

	deleteLocation() {
		return global.db.tx(t => t.batch([
			t.none(
				`delete from locations2
				 where loc_id = ${this.locationId}`
			),
			t.none(
				`delete from master_location2
				 where loc_id = ${this.locationId}`
			)
		]));
	}

	restoreLoyalPopulation() {
		return global.db.tx(t => t.batch([
			t.none(
				`update users
				 set cash = cash - (population - loyal_popul)
				 from locations2, master_location2
				 where locations2.loc_id = master_location2.loc_id and locations2.loc_id = ${this.locationId} and id = ${this.masterId}`
			),
			t.none(
				`update master_location2
				 set loyal_popul = population
				 from locations2
			   where locations2.loc_id = master_location2.loc_id
				 and locations2.loc_id = ${this.locationId}`
			)
		]));
	}

	static deleteAllLocations() {
		global.db.none('delete from locations2');
	}

	static getAllLocations() {
		return global.db.any(`select * from locations2
													join master_location2 ON locations2.loc_id = master_location2.loc_id
													join location_checkin on locations2.loc_id = location_checkin.loc_id
													JOIN users on users.id = master_location2.user_id;`)
			.then(locations => new Promise((res) => {
				const occupiedLocations = [];
				locations.forEach((item) => {
					occupiedLocations.push(new OccupiedLocation({
						northWest: {
							lat: item.lat,
							lng: item.lng
						},
						locationId: item.loc_id,
						locationName: item.loc_name,
						userId: item.user_id,
						userName: item.name,
						population: item.population,
						dailyBank: item.daily_bank,
						dailyMessage: item.daily_msg,
						loyalPopulation: item.loyal_popul,
						dailyCheckin: (global.lastDailyEvent - new Date(item.checkin_date)) < 0,
						creationDate: item.creation_date
					}));
				});
				res(occupiedLocations);
			}));
	}

	static getAllLocationsGeoJSON() {
		return OccupiedLocation.getAllLocations()
			.then(locArray => new Promise((res) => {
				const geoObj = {
					type: 'FeatureCollection',
					features: []
				};
				locArray.forEach((item) => {
					geoObj.features.push({
						type: 'Feature',
						id: item.locationId,
						properties: {
							color: 'gray',
							background: 'gray',
							info: {
								masterId: item.masterId,
								dailyBank: item.dailyBank > 0,
								population: item.population
							}
						},
						geometry: {
							type: 'Polygon',
							coordinates: [
								item.mapFeatureGeometry
							]
						}
					});
				});
				res(geoObj);
			})

			);
	}

	static getLocationById(id) {
		return global.db.one(
			`select * from locations2
			full join master_location2 on locations2.loc_id = master_location2.loc_id
			full join users on master_location2.user_id = users.id
			full join location_checkin on locations2.user_id = location_checkin.id			
			where locations2.loc_id = $1`, id
		)
			.then(foundLocation => new Promise((res) => {
				res(new OccupiedLocation({
					northWest: {
						lat: foundLocation.lat,
						lng: foundLocation.lng
					},
					locationId: foundLocation.loc_id,
					userId: foundLocation.user_id,
					userName: foundLocation.name,
					population: foundLocation.population,
					dailyBank: foundLocation.daily_bank,
					loyalPopulation: foundLocation.loyal_popul,
					dailyCheckin: (global.lastDailyEvent - new Date(foundLocation.checkin_date)) < 0,
					creationDate: foundLocation.creation_date,
					dailyMessage: foundLocation.daily_msg,
					locationName: foundLocation.loc_name
				}));
			}));
	}

	static checkLocationOnCoords(coords) {
		const location = new EmptyLocation(coords);

		return global.db.oneOrNone(`select * from locations2
						full join master_location2 on locations2.loc_id = master_location2.loc_id
						full join users on master_location2.user_id = users.id
						full join location_checkin on locations2.user_id = location_checkin.id
						where locations2.lat = ${location.northWest.lat} and locations2.lng = ${location.northWest.lng}`)
			.then(foundLocation => new Promise((res) => {
				if (!foundLocation) {
					res(location);
				} else {
					res(new OccupiedLocation({
						northWest: {
							lat: foundLocation.lat,
							lng: foundLocation.lng
						},
						locationId: foundLocation.loc_id,
						userId: foundLocation.user_id,
						userName: foundLocation.name,
						population: foundLocation.population,
						dailyBank: foundLocation.daily_bank,
						loyalPopulation: foundLocation.loyal_popul,
						dailyCheckin: (global.lastDailyEvent - new Date(foundLocation.checkin_date)) < 0,
						creationDate: foundLocation.creation_date,
						dailyMessage: foundLocation.daily_msg,
						locationName: foundLocation.loc_name
					}));
				}
			}));
	}

	static recalcLocationsLifecycle() {
		return global.db.tx(t => t.batch([
			t.none(`
				delete from locations2
				where loc_id IN (
					SELECT loc_id from location_checkin
					WHERE (now() - checkin_date) > '24 hours'
				) AND loc_id IN (
					select loc_id from master_location2
					where loyal_popul = 0
				);
			`),
			t.none(`
				delete from master_location2
				where loyal_popul = 0;
			`)
		]))
			.then(() => global.db.none(`
				update locations2
				set daily_bank = loyal_popul
				from master_location2
				where locations2.loc_id = master_location2.loc_id;
			`)
			)
			.then(() => global.db.none(`
				update master_location2 
				set loyal_popul = loyal_popul - ceil(loyal_popul * 0.1)
				where loc_id IN (
					SELECT loc_id from location_checkin
					WHERE (now() - checkin_date) > '1 day'
				);
			`)
			);
	}
}
module.exports = OccupiedLocation;
