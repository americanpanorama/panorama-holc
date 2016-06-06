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

		 selectedCity: null,
		 selectedState: null

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
				query: 'SELECT *, st_xmin(the_geom) as minLng, st_xmax(the_geom) as maxLng, st_ymin(the_geom) as minLat, st_ymax(the_geom) as maxLat, st_x(st_centroid(the_geom)) as centerLng, st_y(st_centroid(the_geom)) as centerLat FROM holc_maps order by state, file_name',
				format: 'JSON'
			},
			{
				query: 'SELECT distinct(holc_ads.id), state, city FROM holc_ad_data join digitalscholarshiplab.holc_polygons on polygon_id = holc_polygons.neighborhood_id join holc_ads on holc_polygons.ad_id = holc_ads.id order by state, city',
				format: 'JSON'
			},
			{
				query: 'SELECT distinct(digitalscholarshiplab.holc_ads.id), city, state, st_xmin(digitalscholarshiplab.holc_polygons.the_geom) as minLng, st_xmax(digitalscholarshiplab.holc_polygons.the_geom) as maxLng, st_ymin(digitalscholarshiplab.holc_polygons.the_geom) as minLat, st_ymax(digitalscholarshiplab.holc_polygons.the_geom) as maxLat, st_x(st_centroid(digitalscholarshiplab.holc_polygons.the_geom)) as centerLng, st_y(st_centroid(digitalscholarshiplab.holc_polygons.the_geom)) as centerLat, looplat, looplng FROM digitalscholarshiplab.holc_polygons join digitalscholarshiplab.holc_ads on ad_id = digitalscholarshiplab.holc_ads.id order by state, city',
				format: 'JSON'
			}
		]).then((response) => {
			this.data.maps = this.parseMapData(response[0]);
			this.data.cityIdsWithADs = response[1].map((row) => row.id);
			this.data.citiesWithPolygons = this.parseCitiesWithPolygonsData(response[2]);
			
			this.data.selectedCity = state.selectedCity;
			this.data.selectedState = state.selectedState;

			this.emit(AppActionTypes.initialDataLoaded);
		},
		(error) => {
			// TODO: handle this.
			console.log('RasterStore received error:', log);
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

	setSelectedState: function (state) {
		if (typeof(state) !== 'undefined' && state !== this.data.selectedState) {
			this.data.selectedCity = undefined;
			this.emit(AppActionTypes.storeChanged);
		}
	},

	getAllRasters: function () { return this.data.maps; },

	getSelectedCity: function () { return this.data.selectedCity; },

	getAllCitiesWithPolygons: function() { return this.data.citiesWithPolygons; },

	// returns everything or a specified attribute
	getSelectedCityMetadata: function(key=null) { 
		if (!this.getSelectedCity()) {
			return false;
		}
		return (key) ? this.data.maps[this.getSelectedCity()][key] : this.data.maps[this.getSelectedCity()]; 
	},

	getCityMetadata: function(city_id, key=null) {
		return (this.data.maps[city_id]) ? (key && this.data.maps[city_id][key]) ? this.data.maps[city_id][key] : this.data.maps[city_id] : null;
	},

	getMapBounds: function () {
		return [ 
			[ this.getSelectedCityMetadata('minLat'), this.getSelectedCityMetadata('minLng') ], 
			[ this.getSelectedCityMetadata('maxLat'), this.getSelectedCityMetadata('maxLng') ] 
		];
	},

	getCenter: function() {
		return [ this.getSelectedCityMetadata('centerLat'), this.getSelectedCityMetadata('centerLng')];
	},

	getCenterOld: function() {
		let bounds = this.getMapBounds();
		return [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
	},

	getMapBoundsForState: function (state) {
		let minLat = 90, minLng = 0, maxLat = 0, maxLng = -180;
		let citiesForState = this.getCitiesForState(state);

		citiesForState.map((cityData) => {
			minLat = (cityData.minLat && cityData.minLat < minLat) ? cityData.minLat : minLat;
			maxLat = (cityData.maxLat && cityData.maxLat > maxLat) ? cityData.maxLat : maxLat;
			minLng = (cityData.minLng && cityData.minLng < minLng) ? cityData.minLng : minLng;
			maxLng = (cityData.maxLng && cityData.maxLng > maxLng) ? cityData.maxLng : maxLng;
		});

		return [[ minLat, minLng ],[ maxLat, maxLng ]];
	},

	getCenterForState: function(state) {
		let bounds = this.getMapBoundsForState(state);
		return [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
	},

	getCitiesForState: function (state) {
		return this.getCitiesList().filter(function(cityData) { return (cityData.state == state); });
	},

	getMapUrl: function () {
		return this.getSelectedCityMetadata('mapurl');
	},

	getMapThumbnail: function () {
		return this.getSelectedCityMetadata('mapThumbnail');
	},

	// return a flat list of the HOLC maps for rendering
	getCitiesList: function() { 
		let cities = this.combineCitiesLists();
		return Object.keys(cities).map(cityId => cities[cityId]); 
	},

	getStatesObject: function() {
		let statesObject = {};
		Object.keys(this.data.maps).map(cityId => {
			statesObject[this.data.maps[cityId].state] = {
				id: this.data.maps[cityId].state,
				name: stateAbbrs[this.data.maps[cityId].state],
				citiesIds: this.getCitiesForState(this.data.maps[cityId].state).map((cityData) => cityData.id)
			};
		});
		return statesObject;
	},

	getStatesList: function() {
		let states = this.getStatesObject();
		return Object.keys(states).map(stateAbbr => states[stateAbbr]);
	},

	getStatesWithFirstCities: function() {
		let states = [],
			  cities = this.combineCitiesLists(),
			  stateInList = function(state) {
				  let inList = false;
				  states.map((cityData) => {
					  if (cityData.state == state) {
						  inList = true;
					  }
				  });
				  return inList;
			  };

		Object.keys(cities).map((cityId) => {
			if (!stateInList(this.data.maps[cityId].state)) {
				states.push(Object.assign({}, this.data.maps[cityId]));
			}
		}); 

		states.map((cityData) => { cityData.name = stateAbbrs[cityData.state]; });

		return states;
	},

	getFirstCityOfState: function(state) {
		let statesWithFirstCities = this.getStatesWithFirstCities();
		for (let i in statesWithFirstCities) {
			if (statesWithFirstCities[i].state == state) {
				return statesWithFirstCities[i];
			}
		}
	},
	
	// return a flat list of the HOLC maps for rendering
	getMapsList: function() { return Object.keys(this.data.maps).map((cityId) => this.data.maps[cityId]); },

	parseMapData: function (data) {
		let maps = {};

		data.forEach(mapData => {
			maps[mapData.map_id] = {
				cityId : mapData.map_id,
				id: mapData.map_id,
				city: mapData.file_name,
				state: mapData.state,
				name: mapData.file_name, // + ", " + mapData.state,
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
				url: 'http://holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' + mapData.file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/{z}/{x}/{y}.png',
				mapurl: 'http://holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' + mapData.file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/holc-scan.jpg',
				mapThumbnail: 'http://holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' + mapData.file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/thumbnail.jpg'
			};

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
				name: citiesData.city +  ((this.data.cityIdsWithADs.indexOf(citiesData.id ) != -1) ? ' **' : ' *'), // ", " + stateAbbrs[citiesData.state] +
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
			};
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