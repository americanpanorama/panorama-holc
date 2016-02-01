import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import _ from 'lodash';

const RasterStore = {

	data: {
		/**
		 * Metadata about the maps
		 * by year (third order), city (second order), and state, first order
		 * {
		 *   stateX: {
		 *     cityX: {
		 *       yearx: {
		 *         url: 'str',
		 *         bounds: 'latlngbounds',
		 *         minZoom: int,
		 *         maxtZoom: int
		 *       },
		 *       yearY: { ... }
		 *     },
		 *     cityY: { ... },
		 *     name: 'str',
		 *     description: 'str',
		 *     units: 'str'
		 *   },
		 *   stateY: { ... },
		 *   ...
		 * }
		 */
		 maps : {},

		 layersMetadata : [],

		 // this shouldn't be here--it's state data not "real" data
		 selectedCity: null

	},

	// TODO: Make a generic DataLoader class to define an interface,
	// and let CartoDBLoader extend and implement that?
	// Basic idea is that anything with a query method that returns a Promise
	// that resolves with an array of response data or rejects with an error
	// can be used here.
	dataLoader: CartoDBLoader,


	loadInitialData: function (state) {

		this.dataLoader.query([
			{
				query: "SELECT *, st_xmin(the_geom) as minLng, st_xmax(the_geom) as maxLng, st_ymin(the_geom) as minLat, st_ymax(the_geom) as maxLat, st_x(st_centroid(the_geom)) as centerLng, st_y(st_centroid(the_geom)) as centerLat FROM holc_maps order by state, file_name",
				format: "JSON"
			}
		]).then((response) => {
			this.data.maps = this.parseData(response);
			this.data.selectedCity = state.selectedCity;

			//console.log(`[3b] RasterStore updates its cache with the loaded and parsed data, and emits a '${ AppActionTypes.storeChanged }' event from RasterStore.loadInitialData().`);
			this.emit(AppActionTypes.initialDataLoaded);
		},
		(error) => {

			// TODO: handle this.
			console.log("Commodity received error:", log);
			throw error;

		});


	},

	/**
	 * The selected city for the whole application to display.
	 */
	setSelectedCity: function (cityId) {

		if (typeof(cityId) !== 'undefined' && cityId !== this.data.selectedCity) {
			this.data.selectedCity = cityId;
			this.emit(AppActionTypes.storeChanged);
		}

	},

	getAllRasters: function () { return this.data.maps; },

	getSelectedCity: function () { return this.data.selectedCity; },

	// returns everything or a specified attribute
	getSelectedCityMetadata: function(key=null) { 
		return (key) ? this.data.maps[this.getSelectedCity()][key] : this.data.maps[this.getSelectedCity()]; 
	},

	// return a flat list of the HOLC maps for rendering
	getMapsList: function() { return Object.keys(this.data.maps).map((cityId) => this.data.maps[cityId]); },

	// returns raster metadata as a simple list for rendering
	/* getCitiesList: function() {
		return Object.keys(this.data.maps).map( cityId => ({
			state: this.data.maps[cityId].state,
			name: this.data.maps[cityId].name,
			year: this.data.maps[cityId].year,
			display: this.data.maps[cityId].name + ", " + this.data.maps[cityId].state,
			cityId: this.data.maps[cityId].cityId
		})
	)}, */

	/* getAllMapsForTileLayer: function () {
		let mapsList = [];
		for (let state in this.data.maps) {
			for (let city in this.data.maps[state]) {
				for (let year in this.data.maps[state][city]) {
					mapsList.push({
						minZoom: this.data.maps[state][city][year].minZoom,
						maxZoom: this.data.maps[state][city][year].maxZoom,
						bounds: this.data.maps[state][city][year].bounds,
						url: this.data.maps[state][city][year].url,
						minLat: this.data.maps[state][city][year].minLat,
						maxLat: this.data.maps[state][city][year].maxLat,
						minLng: this.data.maps[state][city][year].minLng,
						maxLng: this.data.maps[state][city][year].maxLng,		
					});
				}
			}
		};

		return mapsList;
	}, */

	parseData: function (data) {
		let maps = {};

		data[0].forEach(mapData => {
			maps[mapData.id] = {
				cityId : mapData.id,
				id: mapData.id,
				name: mapData.file_name,
				state: mapData.state,
				minZoom: mapData.minzoom,
				maxZoom: mapData.maxzoom,
				bounds: mapData.bounds,
				minLat: mapData.minlat,
				maxLat: mapData.maxlat,
				minLng: mapData.minlng,
				maxLng: mapData.maxlng,
				centerLat: mapData.centerlat,
				centerLng: mapData.centerlng,
				loopLat: mapData.looplat,
				loopLng: mapData.looplng,
				url: "http://holc.s3-website-us-east-1.amazonaws.com/tiles/" + mapData.state + "/" + mapData.file_name.replace(/\s+/, "")  + "/" + mapData.year + "/{z}/{x}/{y}.png"
			}

		});

		return maps;

	}
};

// Mixin EventEmitter functionality
Object.assign(RasterStore, EventEmitter.prototype);

// Register callback to handle all updates
AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			//console.log(`[2] The '${ AppActionTypes.loadInitialData }' event is handled by RasterStore....`);
			RasterStore.loadInitialData(action.state);
			break;

		case AppActionTypes.citySelected:
			RasterStore.setSelectedCity(action.value);
			break;
	}


	return true;

});

export default RasterStore;