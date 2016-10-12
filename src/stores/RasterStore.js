import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';

import stateAbbrs from '../../data/state_abbr.json';

const RasterStore = {

	data: {
		 maps : [],
		 loaded: false
	},

	dataLoader: CartoDBLoader,

	loadInitialData: function (state) {
		this.dataLoader.query([
			{
				query: 'SELECT holc_maps.*, ST_asgeojson(holc_maps.the_geom, 4) as the_geojson, st_xmin(holc_maps.the_geom) as minLng, st_xmax(holc_maps.the_geom) as maxLng, st_ymin(holc_maps.the_geom) as minLat, st_ymax(holc_maps.the_geom) as maxLat, st_x(st_centroid(holc_maps.the_geom)) as centerLng, st_y(st_centroid(holc_maps.the_geom)) as centerLat FROM holc_maps',
				format: 'JSON'
			},
			{
				query: 'SELECT distinct(hm1.map_id) FROM digitalscholarshiplab.holc_maps AS hm1, digitalscholarshiplab.holc_maps AS hm2 WHERE hm1.map_id <> hm2.map_id AND ST_Overlaps(hm1.the_geom, hm2.the_geom)',
				format: 'JSON'
			}
		]).then((response) => {
			let overlaps = response[1].map(overlapObj => overlapObj.map_id);
			this.data.maps = response[0].map(mapData => {
				return ({
					id: mapData.map_id,
					parent_id: mapData.parent_id,
					the_geojson: JSON.parse(mapData.the_geojson),
					overlaps: (overlaps.indexOf(mapData.map_id) !== -1),
					city: mapData.name,
					state: mapData.state,
					file_name: mapData.file_name,
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
					sortLat: mapData.sortlat,
					sortLng: mapData.sortlng,
					inset: mapData.inset,
					url: '//holc.s3-website-us-east-1.amazonaws.com/tiles/' + mapData.state + '/' +mapData.	file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/{z}/{x}/{y}.png',
					retinaUrl: '//holc.s3-website-us-east-1.amazonaws.com/tiles_retina/' + mapData.state + '/' +mapData.	file_name.replace(/\s+/g, '')  + '/' + mapData.year + '/{z}/{x}/{y}.png',
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

	getGeoJSON: function (mapId) { return this._getDataForMap(mapId).the_geojson; },

	getMapBoundsForCountry: function () { return this.calculateMapsBounds(this.data.maps.map(cityData => cityData.id)); },

	getMapBoundsForState: function (state) { return this.calculateMapsBounds(this.getMapIdsForState(state)); },

	getMapBoundsByAdId: function(adId) { return (this.data.maps[adId].minLat && this.data.maps[adId].minLng && this.data.maps[adId].maxLat && this.data.maps[adId].maxLng) ? [[ this.data.maps[adId].minLat, this.data.maps[adId].minLng ], [ this.data.maps[adId].maxLat, this.data.maps[adId].maxLng ]] : null; },

	getMapIdsForState: function (state) { return this.data.maps.filter(cityData => (cityData.state == state)).map(cityData => cityData.id); },

	getMapsFromIds: function (mapIds) { return this.data.maps.filter(cityData => (mapIds.indexOf(cityData.id) !== -1)); },

	getMapUrl: function (mapId) { return this.data.maps[mapId].mapUrl; },

	getOverlappingMapIds: function() { return this.data.maps.filter(cityData => cityData.overlaps).map(cityData => cityData.id ) },

	getRectifiedUrl: function (mapId) { return this.data.maps[mapId].rectifiedUrl; },

	getSortPoint: function (mapId) { return (this._getDataForMap(mapId) && this._getDataForMap(mapId).sortLat && this._getDataForMap(mapId).sortLng) ? [ this._getDataForMap(mapId).sortLat, this._getDataForMap(mapId).sortLng ] : null; },

	hasLoaded: function() { return this.data.loaded; },

	_getDataForMap: function(mapId) { 
		let matches = this.data.maps.filter(mapData => (mapData.id == mapId));
		return (matches) ? matches[0] : false;
	},

	isInset: function(mapId) { return this.data.maps[mapId].inset; },

	overlapsAnotherMap: function(mapId) { return this._getDataForMap(mapId).overlaps },

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