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
		 selectedState: null,
		 loaded: false

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
				query: 'SELECT total_pop_1930, total_pop_1940, american_indian_eskimo_1930, american_indian_eskimo_1940, asian_pacific_1930 as asian_pacific_islander_1930, asian_pacific_1940 as asian_pacific_islander_1940, black_pop_1930, black_pop_1940, white_pop_1930, white_pop_1940, ad_id, holc_maps.*, st_xmin(holc_maps.the_geom) as minLng, st_xmax(holc_maps.the_geom) as maxLng, st_ymin(holc_maps.the_geom) as minLat, st_ymax(holc_maps.the_geom) as maxLat, st_x(st_centroid(holc_maps.the_geom)) as centerLng, st_y(st_centroid(holc_maps.the_geom)) as centerLat FROM holc_maps join holc_maps_ads_join hmaj on hmaj.map_id = holc_maps.map_id join holc_ads on holc_ads.city_id = hmaj.ad_id order by parent_id desc',
				format: 'JSON'
			},
			{
				query: 'SELECT distinct(holc_ads.city_id), state, city FROM holc_ad_data join digitalscholarshiplab.holc_polygons on polygon_id = holc_polygons.neighborhood_id join holc_ads on holc_polygons.ad_id = holc_ads.city_id order by state, city',
				format: 'JSON'
			},
			{
				query: "SELECT ad_id, sum(st_area(the_geom_webmercator)) / 1609.34^2 as total_area, sum(CASE WHEN holc_grade = 'A' THEN st_area(the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_a, sum(CASE WHEN holc_grade = 'B' THEN st_area(the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_b, sum(CASE WHEN holc_grade = 'C' THEN st_area(the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_c, sum(CASE WHEN holc_grade = 'D' THEN st_area(the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_d FROM digitalscholarshiplab.holc_polygons group by ad_id order by ad_id desc",
				format: 'JSON'
			}
		]).then((response) => {
			this.data.maps = this.parseMapData(response[0], response[2], response[1]);
			this.data.cityIdsWithADs = response[1].map((row) => row.id);
			
			this.data.selectedCity = state.selectedCity;
			this.data.selectedState = response[2][0].state;

			this.data.loaded = true;

			// console.log('RasterStore finished loading');

			this.emit(AppActionTypes.storeChanged);
		},
		(error) => {
			// TODO: handle this.
			console.log('RasterStore received error:', error);
			throw error;
		});
	},

	calculateSimpleRingsRadii: function (areaData) {
		let furthestRadius = 25000,
			fullArea = Math.PI * furthestRadius * furthestRadius,
			outerRadius,
			innerRadius = 0,
			donutArea,
			gradeArea,
			radii = {};

		['d','c','b','a'].forEach((grade) => {
			let donutholeArea = Math.PI * innerRadius * innerRadius,
				gradeArea = fullArea * (areaData[grade] / areaData.total),
				outerRadius = Math.round(Math.sqrt((gradeArea + donutholeArea) / Math.PI));
			radii[grade] = {
				'inner': innerRadius,
				'outer': outerRadius
			};
			innerRadius = outerRadius;
		});

		return radii;
	},


	


	parseMapData: function (citiesData, citiesWithPolygonsData, citiesWithADs) {
		let maps = {};

		citiesData.forEach(mapData => {
			maps[mapData.map_id] = {
				cityId : mapData.ad_id,
				id: mapData.map_id,
				ad_id: parseInt(mapData.ad_id),
				parent_id: mapData.parent_id,
				city: mapData.name,
				state: mapData.state,
				searchName: (mapData.parent_id) ? '' : mapData.name + ', ' + stateAbbrs[mapData.state],
				name: mapData.name, // + ", " + mapData.state,
				minZoom: mapData.minzoom,
				maxZoom: mapData.maxzoom,
				bounds: [ [mapData.minlat,mapData.minlng], [mapData.maxlat,mapData.maxlng] ],
				minLat: mapData.minlat,
				maxLat: mapData.maxlat,
				minLng: mapData.minlng,
				maxLng: mapData.maxlng,
				centerLat: mapData.centerlat,
				centerLng: mapData.centerlng,
				population_1930: mapData.total_pop_1930,
				population_1940: mapData.total_pop_1940,
				american_indian_eskimo_1930: mapData.american_indian_eskimo_1930,
				american_indian_eskimo_1940: mapData.american_indian_eskimo_1940,
				asian_pacific_islander_1930: mapData.asian_pacific_islander_1930,
				asian_pacific_islander_1940: mapData.asian_pacific_islander_1940,
				black_pop_1930: mapData.black_pop_1930,
				black_pop_1940: mapData.black_pop_1940,
				white_pop_1930: mapData.white_pop_1930,
				white_pop_1940: mapData.white_pop_1940,
				hasPolygons: false,
				hasADs: false,
				inset: mapData.inset,
				url: '//holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' +mapData.	file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/{z}/{x}/{y}.png',
				mapUrl: (!mapData.inset) ? '//holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' +mapData	.file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/holc-scan.jpg' : null,
				mapThumbnail: '//holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' + 	mapData.file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/thumbnail.jpg',
				rectifiedUrl: '//holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' + 	mapData.file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/rectified.zip'
			}
		});

		citiesWithPolygonsData.forEach(areaData => {
			if (maps[areaData.ad_id]) {
				maps[areaData.ad_id].hasPolygons = true,
				maps[areaData.ad_id].area = {
					'total' : areaData.total_area,
					'a': areaData.area_a,
					'b': areaData.area_b,
					'c': areaData.area_c,
					'd': areaData.area_d
				},
				maps[areaData.ad_id].radii = this.calculateSimpleRingsRadii(maps[areaData.ad_id].area)
			}
		});

		citiesWithADs.forEach(areaData => {
			if (maps[areaData.id]) {
				maps[areaData.id].hasADs = true;
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
				name: citiesData.city +  ((this.data.cityIdsWithADs.indexOf(citiesData.id ) != -1) ? ' **' : ' *'), // ", " + stateAbbrs[citiesData.state] +
				minLat: citiesData.minlat,
				maxLat: citiesData.maxlat,
				minLng: citiesData.minlng,
				maxLng: citiesData.maxlng,
				centerLat: citiesData.centerlat,
				centerLng: citiesData.centerlng,
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
	},

	/* setters */

	/**
	 * The selected city for the whole application to display.
	 */
	setSelectedCity: function (cityId) {
		this.data.selectedCity = cityId;  
	},

	setSelectedState: function (state) {
		if (typeof(state) !== 'undefined' && state !== this.data.selectedState) {
			this.data.selectedCity = undefined;
			this.emit(AppActionTypes.storeChanged);
		}
	},

	/* gets */

	getAllCitiesWithPolygons: function() { return this.data.citiesWithPolygons; },

	getAllRasters: function () { return this.data.maps; },

	getCenter: function() {
		return [ this.getSelectedCityMetadata('centerLat'), this.getSelectedCityMetadata('centerLng')];
	},

	getCenterForCountry: function() {
		let bounds = this.getMapBoundsForCountry();
		return [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
	},

	getCenterForState: function(state) {
		let bounds = this.getMapBoundsForState(state);
		return [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
	},

	getCenterOld: function() {
		let bounds = this.getMapBounds();
		return [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
	},

	getCitiesForState: function (state) { return this.getCitiesList().filter(function(cityData) { return (cityData.state == state); }); },

	// return a flat list of the HOLC maps for rendering
	getCitiesList: function() { 
		let cities = this.combineCitiesLists();
		return Object.keys(cities).map(cityId => cities[cityId]); 
	},

	getCityIdsAndNames: function () {
		return Object.keys(this.data.maps).map((id) => {
			return {
				id: parseInt(id),
				cityName: this.data.maps[id].city + ', ' + stateAbbrs[this.data.maps[id].state]
			}
		});
	},

	getCityIdsWithNames: function () {
		let idsAndNames = {};

		Object.keys(this.data.maps).forEach((id) => {
			idsAndNames[id] = this.data.maps[id].city + ', ' +stateAbbrs[this.data.maps[id].state]
		});

		return idsAndNames;
	},

	getCityNames: function () {
		return Object.keys(this.data.maps).map((id) => this.data.maps[id].city + ', ' +stateAbbrs[this.data.maps[id].state]);
	},

	getCityMetadata: function(city_id, key=null) {
		return (this.data.maps[city_id]) ? (key && this.data.maps[city_id][key]) ? this.data.maps[city_id][key] : this.data.maps[city_id] : null;
	},

	getFirstCityOfState: function(state) {
		let statesWithFirstCities = this.getStatesWithFirstCities();
		for (let i in statesWithFirstCities) {
			if (statesWithFirstCities[i].state == state) {
				return statesWithFirstCities[i];
			}
		}
	},

	getMapBounds: function () {
		return [ 
			[ this.getSelectedCityMetadata('minLat'), this.getSelectedCityMetadata('minLng') ], 
			[ this.getSelectedCityMetadata('maxLat'), this.getSelectedCityMetadata('maxLng') ] 
		];
	},

	getMapBoundsForCountry: function () {
		let minLat = 90, minLng = 0, maxLat = 0, maxLng = -180;

		this.getCitiesList().forEach((cityData) => {
			minLat = (cityData.minLat && cityData.minLat < minLat) ? cityData.minLat : minLat;
			maxLat = (cityData.maxLat && cityData.maxLat > maxLat) ? cityData.maxLat : maxLat;
			minLng = (cityData.minLng && cityData.minLng < minLng) ? cityData.minLng : minLng;
			maxLng = (cityData.maxLng && cityData.maxLng > maxLng) ? cityData.maxLng : maxLng;
		});

		return [[ minLat, minLng ],[ maxLat, maxLng ]];
	},

	getMapBoundsForState: function (state) {
		let minLat = 90, minLng = 0, maxLat = 0, maxLng = -180;
		let citiesForState = this.getCitiesForState(state);

		citiesForState.forEach((cityData) => {
			minLat = (cityData.minLat && cityData.minLat < minLat) ? cityData.minLat : minLat;
			maxLat = (cityData.maxLat && cityData.maxLat > maxLat) ? cityData.maxLat : maxLat;
			minLng = (cityData.minLng && cityData.minLng < minLng) ? cityData.minLng : minLng;
			maxLng = (cityData.maxLng && cityData.maxLng > maxLng) ? cityData.maxLng : maxLng;
		});

		return [[ minLat, minLng ],[ maxLat, maxLng ]];
	},

	getMapBoundsByAdId: function(adId) {
		return [ 
			[ this.data.maps[adId].minLat, this.data.maps[adId].minLng ], 
			[ this.data.maps[adId].maxLat, this.data.maps[adId].maxLng ] 
		];
	},

	getMapThumbnail: function () { return this.getSelectedCityMetadata('mapThumbnail'); },

	getMapUrl: function (mapId) { return this.data.maps[mapId].mapUrl; },

	// return a flat list of the HOLC maps for rendering
	getMapsList: function() { return Object.keys(this.data.maps).map((cityId) => this.data.maps[cityId]); },

	getRectifiedUrl: function (mapId) {
		return this.data.maps[mapId].rectifiedUrl;
	},

	getSelectedCity: function () { return this.data.selectedCity; },

	// returns everything or a specified attribute
	getSelectedCityMetadata: function(key=null) { 
		if (!this.getSelectedCity()) {
			return null;
		}
		return (key) ? this.data.maps[this.getSelectedCity()][key] : this.data.maps[this.getSelectedCity()]; 
	},

	getSelectedMaps: function (requestedMapIds, selectedAd = null) {
		let selectedMaps = [];
		const allMaps = this.getMapsList();

		allMaps.forEach(map => {
			if (requestedMapIds.indexOf(map.ad_id) !== -1 && map.ad_id !== selectedAd) {
				selectedMaps.push(map);
			}
		});

		allMaps.forEach(map => {
			if (requestedMapIds.indexOf(map.ad_id) !== -1 && map.ad_id == selectedAd) {
				selectedMaps.push(map);
			}
		});


		return selectedMaps;
	},

	getSelectedState () { return this.data.selectedState; },

	getStatesList: function() {
		let states = this.getStatesObject();
		return Object.keys(states).map(stateAbbr => states[stateAbbr]);
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

	hasLoaded: function() {
		return this.data.loaded;
	},

	isInset: function(mapId) { return this.data.maps[mapId].inset; },

	selectedHasPolygons: function() {
		return (this.data.maps[this.data.selectedCity]) ? this.data.maps[this.data.selectedCity].hasPolygons : false;
	},



};

// Mixin EventEmitter functionality
Object.assign(RasterStore, EventEmitter.prototype);

// Register callback to handle all updates
RasterStore.dispatchToken = AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			RasterStore.loadInitialData(action.state);
			if (action.state.selectedCity) {
				RasterStore.setSelectedCity(action.state.selectedCity);
			}
			break;

		case AppActionTypes.citySelected:
			RasterStore.setSelectedCity(action.value);
			break;
	}

	return true;

});

export default RasterStore;