import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';

import stateAbbrs from '../../data/state_abbr.json';

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
		 citiesWithPolygons: {}, 
		 cityIdsWithADs: [],

		 layersMetadata : [],
		 hasLoaded: false,

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
			},
			{
				query: "SELECT distinct(digitalscholarshiplab.holc_ads.id) FROM digitalscholarshiplab.holc_ad_data join digitalscholarshiplab.holc_polygons on polygon_id = digitalscholarshiplab.holc_polygons.id join digitalscholarshiplab.holc_ads on digitalscholarshiplab.holc_polygons.ad_id = digitalscholarshiplab.holc_ads.id",
				format: "JSON"
			},
			{
				query: "SELECT distinct(digitalscholarshiplab.holc_ads.id), city, state, st_xmin(digitalscholarshiplab.holc_polygons.the_geom) as minLng, st_xmax(digitalscholarshiplab.holc_polygons.the_geom) as maxLng, st_ymin(digitalscholarshiplab.holc_polygons.the_geom) as minLat, st_ymax(digitalscholarshiplab.holc_polygons.the_geom) as maxLat, st_x(st_centroid(digitalscholarshiplab.holc_polygons.the_geom)) as centerLng, st_y(st_centroid(digitalscholarshiplab.holc_polygons.the_geom)) as centerLat, looplat, looplng FROM digitalscholarshiplab.holc_polygons join digitalscholarshiplab.holc_ads on ad_id = digitalscholarshiplab.holc_ads.id order by state, city",
				format: "JSON"
			}
		]).then((response) => {
			this.data.maps = this.parseMapData(response[0]);
			this.data.cityIdsWithADs = response[1].map((row) => row.id);
			this.data.citiesWithPolygons = this.parseCitiesWithPolygonsData(response[2]);
			
			this.data.selectedCity = state.selectedCity;

			this.data.hasLoaded = true;

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

	getAllCitiesWithPolygons: function() { return this.data.citiesWithPolygons; },

	// returns everything or a specified attribute
	getSelectedCityMetadata: function(key=null) { 
		return (key) ? this.data.maps[this.getSelectedCity()][key] : this.data.maps[this.getSelectedCity()]; 
	},

	getMapBounds: function () {
		return [ 
			[ this.getSelectedCityMetadata('minLat'), this.getSelectedCityMetadata('minLng') ], 
			[ this.getSelectedCityMetadata('maxLat'), this.getSelectedCityMetadata('maxLng') ] 
		]
	},

	hasLoaded: function() {
		return this.data.hasLoaded;
	},

	// return a flat list of the HOLC maps for rendering
	getCitiesList: function() { 
		let cities = this.combineCitiesLists();
		return Object.keys(cities).map((cityId) => cities[cityId]); 
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

	parseMapData: function (data) {
		let maps = {};

		data.forEach(mapData => {
			maps[mapData.id] = {
				cityId : mapData.id,
				id: mapData.id,
				city: mapData.file_name,
				state: mapData.state,
				name: mapData.file_name + ", " + mapData.state,
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
				hasPolygons: false,
				url: "http://holc.s3-website-us-east-1.amazonaws.com/tiles/" + mapData.state + "/" + mapData.file_name.replace(/\s+/, "")  + "/" + mapData.year + "/{z}/{x}/{y}.png"
			}

		});

		return maps;

	},

	parseCitiesWithPolygonsData: function (data) {
		let cities = {};

		data.forEach(citiesData => {
			cities[citiesData.id] = {
				adId:  citiesData.id,
				id: citiesData.id,
				city: citiesData.city,
				state: citiesData.state,
				name: citiesData.city + ", " + stateAbbrs[citiesData.state] + ((this.data.cityIdsWithADs.indexOf(citiesData.id ) != -1) ? " **" : ' *'),
				minLat: citiesData.minlat,
				maxLat: citiesData.maxlat,
				minLng: citiesData.minlng,
				maxLng: citiesData.maxlng,
				centerLat: citiesData.centerlat,
				centerLng: citiesData.centerlng,
				loopLat: citiesData.looplat,
				loopLng: citiesData.looplng,
				hasPolygons: true,
				hasADs: (this.data.cityIdsWithADs.indexOf(citiesData.id ) != -1)
			}
		});

		return cities;
	},

	combineCitiesLists: function () {
		let combinedList = {};
		Object.keys(this.data.maps).map((id, i) => {
			combinedList[id] = (this.data.citiesWithPolygons[id]) ? this.data.citiesWithPolygons[id] : this.data.maps[id];
		});

		return combinedList;
	}

};

// Mixin EventEmitter functionality
Object.assign(RasterStore, EventEmitter.prototype);

// Register callback to handle all updates
AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			RasterStore.loadInitialData(action.state);
			break;

		case AppActionTypes.citySelected:
			RasterStore.setSelectedCity(action.value);
			break;
	}


	return true;

});

export default RasterStore;