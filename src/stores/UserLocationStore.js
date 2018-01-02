import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';

const UserLocationStore = {

	data: {
		latLng: null,
		adId: null,
		city: null,
		neighborhood: null,
		offerZoomTo: false
	},

	dataLoader: CartoDBLoader,

	loadData: function (point, selectedCity) {
		this.data.latLng = point;

		this.dataLoader.query([
			{
				query: 'SELECT ad_id, city, ST_distance(ST_setsrid(ST_MakePoint(holc_ads.looplng, holc_ads.looplat),4326), ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326)) as distance, st_xmin( st_envelope(st_collect(ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326), holc_maps.the_geom))) as bbxmin, st_xmax( st_envelope(st_collect(ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326), holc_maps.the_geom))) as bbxmax, st_ymin( st_envelope(st_collect(ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326), holc_maps.the_geom))) as bbymin, st_ymax( st_envelope(st_collect(ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326), holc_maps.the_geom))) as bbymax from holc_maps join holc_maps_ads_join on holc_maps.map_id = holc_maps_ads_join.map_id join holc_ads on holc_ads.city_id = holc_maps_ads_join.ad_id order by distance limit 1',
				format: 'JSON'
			}
		]).then((response) => {
			this.data.city = response[0][0].city;
			this.data.adId = response[0][0].ad_id;
			// offer zoom if any city isn't already selected
			this.data.offerZoomTo = !selectedCity;

			// also don't over zoom if the distance is greater than 65 miles (about 100000 meters)
			this.data.offerZoomTo = (response[0][0].distance * 111.325 > 100) ? false : this.data.offerZoomTo;

			this.emit(AppActionTypes.storeChanged);
		}, (error) => {
			// TODO: handle this.
			console.log('Location received error:', error);
			throw error;
		});

	},

	setOfferZoomTo: function (trueOrFalse) {
		this.data.offerZoomTo = trueOrFalse;
		this.emit(AppActionTypes.storeChanged);
	},

	getPoint: function() {
		return this.data.latLng;
	},

	getAdId: function() {
		return this.data.adId;
	},

	getCity: function() {
		return this.data.city;
	},

	getNeighborhood: function() {
		return this.data.neighborhood;
	},

	getOfferZoomTo: function() {
		return this.data.offerZoomTo;
	},
}

// Mixin EventEmitter functionality
Object.assign(UserLocationStore, EventEmitter.prototype);

// Register callback to handle all updates
AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.userLocated:
			if (action.point) {
				UserLocationStore.loadData(action.point, action.selectedCity);
			}
			break;

		case AppActionTypes.userRespondedToZoomOffer:
			UserLocationStore.setOfferZoomTo(false);
			break;

	}
	return true;
});

export default UserLocationStore;