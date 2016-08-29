import * as L from 'leaflet';
import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import AreaDescriptionsStore from './AreaDescriptionsStore';
import CitiesStore from './CitiesStore';
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
		hasLoaded: false,
		initialViewLoaded: false
	},

	loadData: function (theMap, rasters, adsMetadata) {
		const theBounds = theMap.getBounds();
		let visibleHOLCMaps = {},
			visibleHOLCMapsIds = [],
			visibleHOLCMapsByState = {},
			visibleAdIds = []; 

		Object.keys(rasters).forEach((id) => {
			if (rasters[id].bounds && theBounds.intersects(rasters[id].bounds)) {
				visibleHOLCMaps[id] = rasters[id];
				visibleHOLCMapsIds.push(parseInt(id));
			}
		});

		Object.keys(adsMetadata).forEach(ad_id => {
			let cityBounds = (adsMetadata[ad_id].bounds) ? adsMetadata[ad_id].bounds : RasterStore.calculateMapsBounds(adsMetadata[ad_id].mapIds);
			if (cityBounds && theBounds.intersects(cityBounds)) {
				if (visibleAdIds.indexOf(ad_id) == -1) {
					visibleAdIds.push(parseInt(ad_id));
				}
			}
		});

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

	setViewFromBounds: function (bounds) {
		this.data.zoom = this.data.theMap.getBoundsZoom(bounds),
		this.data.center = L.latLngBounds(bounds).getCenter();
		this.emit(AppActionTypes.storeChanged);
		this.viewInitialized();
	},

	viewInitialized: function () { this.data.initialViewLoaded = true; },

	getBounds: function() { return this.data.bounds; },

	getCenter: function() { return this.data.center; },

	getTheMap: function() { return this.data.theMap; },

	getVisibleCitiesForState: function(abbr) { return this.data.visibleHOLCMapsByState[abbr]; },

	getVisibleHOLCMaps: function() { return this.data.visibleHOLCMaps; },

	getVisibleHOLCMapsByState() { return this.data.visibleHOLCMapsByState; },

	getVisibleHOLCMapsIds: function() { return this.data.visibleHOLCMapsIds; },

	getVisibleHOLCMapsList: function() { return Object.keys(this.data.visibleHOLCMaps).map(mapId => this.data.visibleHOLCMaps[mapId]); },

	getVisibleAdIds: function() { return this.data.visibleAdIds.sort((aAdId, bAdId) => (CitiesStore.getCityName(aAdId) > CitiesStore.getCityName(bAdId))); },

	getVisibleStateAbbrs: function () { return Object.keys(this.data.visibleHOLCMapsByState).map(abbr => stateAbbrs[abbr]).sort().map(fullName => { return Object.keys(this.data.visibleHOLCMapsByState).filter(abbr => (fullName == stateAbbrs[abbr]))[0]}); },

	getZoom: function() { return this.data.zoom; },

	isAboveZoomThreshold() { return this.data.zoom >= this.data.adZoomThreshold; },

	hasLoaded() { return this.data.hasLoaded; },

	initialViewLoaded() { return this.data.initialViewLoaded; }
}

// Mixin EventEmitter functionality
Object.assign(MapStateStore, EventEmitter.prototype);

// Register callback to handle all updates
MapStateStore.dispatchToken = AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			// use the loc data in the url if it's there.
			if (action.hashState.loc) {
				MapStateStore.setView(action.hashState.loc.zoom, action.hashState.loc.center);
				MapStateStore.viewInitialized();
			} else {
				MapStateStore.setView(action.state.map.zoom, action.state.map.center);
			}
			break;

		case AppActionTypes.mapInitialized:
			MapStateStore.setTheMap(action.theMap);

			// both the rasters and the cities metadata need to finish loading before visible maps can be determined
			let waitingMapInitialized = setInterval(() => {
				if (RasterStore.hasLoaded()) {
					clearInterval(waitingMapInitialized);

					// adjust the view
					// if an loc was not requested but the city was in the URL, the view is the city
					if (!MapStateStore.initialViewLoaded()) {
						if (action.initialHashState.city) {
							// wait for initial city load
							let waitingCityInitialized = setInterval(() => {
								if (CityStore.hasLoaded()) {
									clearInterval(waitingCityInitialized);
									
									const mapIds = CitiesStore.getMapIds(CityStore.getId()),
										bounds = (CityStore.getPolygonsBounds()) ? CityStore.getPolygonsBounds() : RasterStore.calculateMapsBounds(mapIds);
									MapStateStore.setViewFromBounds(bounds);
								}
							}, 10);
						} else {
							MapStateStore.setViewFromBounds(RasterStore.getMapBoundsForCountry());
						}
					}

					let waitingViewInitialized = setInterval(() => {
						clearInterval(waitingViewInitialized);

						if (MapStateStore.initialViewLoaded()) {
							MapStateStore.loadData(action.theMap, RasterStore.getAllRasters(), CitiesStore.getCitiesMetadata());
						}
					}, 10);
				}
			}, 10);

			break;

		case AppActionTypes.mapMoved:
			if (RasterStore.hasLoaded() && CityStore.hasLoaded()) {
				MapStateStore.loadData(action.theMap, RasterStore.getAllRasters(), CitiesStore.getCitiesMetadata());
			}
			break;

		case AppActionTypes.citySelected:
			// you have to wait for CityStore and RasterStore to finish their initial load
			AppDispatcher.waitFor([RasterStore.dispatchToken]);

			const waitingId = setInterval(() => {
				if (action.value == CityStore.getId()) {
					clearInterval(waitingId);

					if (action.selectedByUser && MapStateStore.getTheMap() !== null) {
						const mapIds = CitiesStore.getMapIds(CityStore.getId()),
							bounds = (CityStore.getPolygonsBounds()) ? CityStore.getPolygonsBounds() : RasterStore.calculateMapsBounds(mapIds);
						MapStateStore.setViewFromBounds(bounds);
					}
				}
			}, 100);
			break;

		case AppActionTypes.stateSelected: 
			if (MapStateStore.getTheMap() !== null) {
				MapStateStore.setViewFromBounds(RasterStore.getMapBoundsForState(action.abbr));
			}
			break;

		case AppActionTypes.countrySelected: 
			if (MapStateStore.getTheMap() !== null) {
				MapStateStore.setViewFromBounds(RasterStore.getMapBoundsForCountry());
			}
			break;

		case AppActionTypes.ADImageOpened:
		case AppActionTypes.neighborhoodSelected:
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