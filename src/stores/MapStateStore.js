import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import AreaDescriptionsStore from './AreaDescriptionsStore';
import CityStore from './CityStore';
import RasterStore from './RasterStore';
import stateAbbrs from '../../data/state_abbr.json';

const MapStateStore = {

	data: {
		theMap: null,
		center: [39.8333333,-98.585522],
		zoom: 12,
		bounds: null,
		visibleHOLCMaps: {},
		visibleHOLCMapsIds: [],
		visibleHOLCMapsByState: {},
		visibleAdIds: [],
		adZoomThreshold: 9,
		hasLoaded: false
	},

	loadData: function (theMap, rasters, adsMetadata) {
		const theBounds = theMap.getBounds();
		let visibleHOLCMaps = {},
			visibleHOLCMapsIds = [],
			visibleHOLCMapsByState = {},
			visibleAdIds = [];

		Object.keys(rasters).forEach((id) => {
			if (theBounds.intersects(rasters[id].bounds)) {
				visibleHOLCMaps[id] = rasters[id];
				visibleHOLCMapsIds.push(parseInt(id));
			}
		});

		Object.keys(adsMetadata).forEach(ad_id => {
			if (theBounds.intersects(adsMetadata[ad_id].bounds)) {
				if (visibleAdIds.indexOf(ad_id) == -1) {
					visibleAdIds.push(parseInt(ad_id));
				}
			}
		});

		// // organize by state
		// visibleHOLCMapsIds.forEach((id) => {
		// 	visibleHOLCMapsByState[visibleHOLCMaps[id].state] = (visibleHOLCMapsByState[visibleHOLCMaps[id].state]) ? visibleHOLCMapsByState[visibleHOLCMaps[id].state] : [];
		// 	visibleHOLCMapsByState[visibleHOLCMaps[id].state].push(visibleHOLCMaps[id]);
		// });
		// // alphabetize
		// Object.keys(visibleHOLCMapsByState).forEach((the_state) => {
		// 	visibleHOLCMapsByState[the_state].sort((a,b) => a.city > b.city);
		// });

		// organize by state
		visibleAdIds.forEach((id) => {
			if (adsMetadata[id]) {
				visibleHOLCMapsByState[adsMetadata[id].state] = (visibleHOLCMapsByState[adsMetadata[id].state]) ? visibleHOLCMapsByState[adsMetadata[id].state] : [];
				visibleHOLCMapsByState[adsMetadata[id].state].push(adsMetadata[id]);
			}
		});
		// alphabetize
		Object.keys(visibleHOLCMapsByState).forEach((the_state) => {
			visibleHOLCMapsByState[the_state].sort((a,b) => a.city > b.city);
		});

		this.data.theMap = theMap;
		this.data.center = [theMap.getCenter().lat, theMap.getCenter().lng];
		this.data.zoom = theMap.getZoom();
		this.data.bounds = theBounds;
		this.data.visibleHOLCMaps = visibleHOLCMaps;
		this.data.visibleHOLCMapsIds = visibleHOLCMapsIds;
		this.data.visibleHOLCMapsByState = visibleHOLCMapsByState;
		this.data.visibleAdIds = visibleAdIds;

		this.data.hasLoaded = true;

		// console.log('MapStateStore finished loading');

		this.emit(AppActionTypes.storeChanged);
	},

	setTheMap: function (theMap) {
		this.data.theMap = theMap;
		this.emit(AppActionTypes.storeChanged);
	},

	setView: function (zoom, center) {
		this.data.zoom = zoom;
		this.data.center = center;
		this.emit(AppActionTypes.storeChanged);
	},

	getBounds: function() { return this.data.bounds; },

	getCenter: function() { return this.data.center; },

	getTheMap: function() { return this.data.theMap; },

	getVisibleCitiesForState: function(abbr) { return this.data.visibleHOLCMapsByState[abbr]; },

	getVisibleHOLCMaps: function() { return this.data.visibleHOLCMaps; },

	getVisibleHOLCMapsByState() { return this.data.visibleHOLCMapsByState; },

	getVisibleHOLCMapsIds: function() { return this.data.visibleHOLCMapsIds; },

	getVisibleHOLCMapsList: function() { return Object.keys(this.data.visibleHOLCMaps).map(mapId => this.data.visibleHOLCMaps[mapId]); },

	getVisibleAdIds: function() { return this.data.visibleAdIds.sort((aAdId, bAdId) => (AreaDescriptionsStore.getCityName(aAdId) > AreaDescriptionsStore.getCityName(bAdId))); },

	getVisibleStateAbbrs: function () { return Object.keys(this.data.visibleHOLCMapsByState).map(abbr => stateAbbrs[abbr]).sort().map(fullName => { return Object.keys(this.data.visibleHOLCMapsByState).filter(abbr => (fullName == stateAbbrs[abbr]))[0]}); },

	getZoom: function() { return this.data.zoom; },

	isAboveZoomThreshold() { return this.data.zoom >= this.data.adZoomThreshold; },

	hasLoaded() { return this.data.hasLoaded; }
}

// Mixin EventEmitter functionality
Object.assign(MapStateStore, EventEmitter.prototype);

// Register callback to handle all updates
MapStateStore.dispatchToken = AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			// you have to wait for RasterStore and, if a city is requested in the hash, CityStore to finish their initial load
			let waitingInitialLoad = setInterval(() => {
				if (RasterStore.hasLoaded() && (!action.state.selectedCity || CityStore.hasLoaded())) {
					clearInterval(waitingInitialLoad);

					let zoom,
						center;

					if (action.hashState.loc) {
						zoom = action.hashState.loc.zoom;
						center = action.hashState.loc.center;
					} else if (CityStore.getId()) {
						zoom = 12;
						center = (CityStore.getPolygonsCenter()) ? CityStore.getPolygonsCenter() : RasterStore.getCenter();
					} else {
						zoom = action.state.map.zoom;
						center = action.state.map.center;
					}

					MapStateStore.setView(zoom, center);
				}
			}, 10);
			break;

		case AppActionTypes.mapInitialized:
			MapStateStore.loadData(action.theMap, action.rasters, action.adsMetadata);

			// if a city has been selected (though the hash), set the new bounds
			if (CityStore.getId()) {
				const bounds = (CityStore.getPolygonsBounds()) ? CityStore.getPolygonsBounds() : RasterStore.getMapBounds(),
					newZoom = action.theMap.getBoundsZoom(bounds),
					newCenter = (CityStore.getPolygonsCenter()) ? CityStore.getPolygonsCenter() : RasterStore.getCenter();
				//MapStateStore.setView(newZoom, newCenter);
			}
			break;

		case AppActionTypes.mapMoved:
			MapStateStore.loadData(action.theMap, action.rasters, action.adsMetadata);
			break;

		case AppActionTypes.citySelected:
			// you have to wait for CityStore and RasterStore to finish their initial load
			AppDispatcher.waitFor([RasterStore.dispatchToken]);

			const waitingId = setInterval(() => {
				if (action.value == CityStore.getId()) {
					clearInterval(waitingId);

					if (action.selectedByUser && MapStateStore.getTheMap() !== null) {
						const bounds = (CityStore.getPolygonsBounds()) ? CityStore.getPolygonsBounds() : RasterStore.getMapBounds(),
							newZoom = MapStateStore.getTheMap().getBoundsZoom(bounds),
							newCenter = (CityStore.getPolygonsCenter()) ? CityStore.getPolygonsCenter() : RasterStore.getCenter();
						MapStateStore.setView(newZoom, newCenter);
					}
				}
			}, 100);
			break;

		case AppActionTypes.stateSelected: 
			if (MapStateStore.getTheMap() !== null) {
				const bounds = RasterStore.getMapBoundsForState(action.abbr),
					newZoom = MapStateStore.getTheMap().getBoundsZoom(bounds),
					newCenter = RasterStore.getCenterForState(action.abbr)
				MapStateStore.setView(newZoom, newCenter);
			}
			break;

		case AppActionTypes.countrySelected: 
			if (MapStateStore.getTheMap() !== null) {
				const bounds = RasterStore.getMapBoundsForCountry(),
					newZoom = MapStateStore.getTheMap().getBoundsZoom(bounds),
					newCenter = RasterStore.getCenterForCountry()
				MapStateStore.setView(newZoom, newCenter);
			}
			break;

		case AppActionTypes.ADImageOpened:
		case AppActionTypes.neighborhoodSelected:
			if (action.type == AppActionTypes) {

			}
			if (MapStateStore.getTheMap() !== null && action.holcId !== null) {
				const bounds = AreaDescriptionsStore.getNeighborhoodBoundingBox(action.adId, action.holcId),
					newZoom = -2 + MapStateStore.getTheMap().getBoundsZoom(bounds),
					newCenter = AreaDescriptionsStore.getNeighborhoodCenter(action.adId, action.holcId);
				if (!MapStateStore.getBounds().contains(bounds)) {
					MapStateStore.getTheMap().panTo(newCenter);
				}
			}
			break;
	}
	return true;
});

export default MapStateStore;