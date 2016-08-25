import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';

import stateAbbrs from '../../data/state_abbr.json';

const RasterStore = {

	data: {
		 maps : {},
		 loaded: false
	},

	dataLoader: CartoDBLoader,

	loadInitialData: function (state) {
		this.dataLoader.query([
			{
				query: 'SELECT holc_maps.*, st_xmin(holc_maps.the_geom) as minLng, st_xmax(holc_maps.the_geom) as maxLng, st_ymin(holc_maps.the_geom) as minLat, st_ymax(holc_maps.the_geom) as maxLat, st_x(st_centroid(holc_maps.the_geom)) as centerLng, st_y(st_centroid(holc_maps.the_geom)) as centerLat FROM holc_maps',
				format: 'JSON'
			}
		]).then((response) => {
			this.data.maps = response[0].map(mapData => {
				return ({
					id: mapData.map_id,
					parent_id: mapData.parent_id,
					city: mapData.name,
					state: mapData.state,
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
					inset: mapData.inset,
					url: '//holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' +mapData.	file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/{z}/{x}/{y}.png',
					mapUrl: (!mapData.inset) ? '//holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' +mapData	.file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/holc-scan.jpg' : null,
					rectifiedUrl: '//holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' + 	mapData.file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/rectified.zip'
				});
			});
			this.data.loaded = true;
			this.emit(AppActionTypes.storeChanged);
		},
		(error) => {
			// TODO: handle this.
			console.log('RasterStore received error:', error);
			throw error;
		});
	},

	/* gets */

	getAllRasters: function () { return this.data.maps; },

	getMapBoundsForCountry: function () { return this.calculateMapsBounds(this.data.maps.map(cityData => cityData.id)); },

	getMapBoundsForState: function (state) { return this.calculateMapsBounds(this.getMapIdsForState(state)); },

	getMapBoundsByAdId: function(adId) {
		return [ 
			[ this.data.maps[adId].minLat, this.data.maps[adId].minLng ], 
			[ this.data.maps[adId].maxLat, this.data.maps[adId].maxLng ] 
		];
	},

	getMapIdsForState: function (state) { return this.data.maps.filter(cityData => (cityData.state == state)).map(cityData => cityData.id); },

	getMapsFromIds: function (mapIds) { return this.data.maps.filter(cityData => (mapIds.indexOf(cityData.id) !== -1)); },

	getMapUrl: function (mapId) { return this.data.maps[mapId].mapUrl; },

	getRectifiedUrl: function (mapId) { return this.data.maps[mapId].rectifiedUrl; },

	hasLoaded: function() { return this.data.loaded; },

	isInset: function(mapId) { return this.data.maps[mapId].inset; },

	calculateMapsBounds(mapIds) {
		let minLat = 90, minLng = 0, maxLat = 0, maxLng = -180;
		this.getMapsFromIds(mapIds).forEach(cityData => {
			if (cityData.minLat && cityData.minLng && cityData.maxLat && cityData.maxLng) {
				minLat = (cityData.minLat && cityData.minLat < minLat) ? cityData.minLat : minLat;
				maxLat = (cityData.maxLat && cityData.maxLat > maxLat) ? cityData.maxLat : maxLat;
				minLng = (cityData.minLng && cityData.minLng < minLng) ? cityData.minLng : minLng;
				maxLng = (cityData.maxLng && cityData.maxLng > maxLng) ? cityData.maxLng : maxLng;
			}
		});
		return [[ minLat, minLng ],[ maxLat, maxLng ]];
	}

};

// Mixin EventEmitter functionality
Object.assign(RasterStore, EventEmitter.prototype);

// Register callback to handle all updates
RasterStore.dispatchToken = AppDispatcher.register((action) => {
	switch (action.type) {
		case AppActionTypes.loadInitialData:
			RasterStore.loadInitialData(action.state);
			break;
	}
	return true;
});

export default RasterStore;