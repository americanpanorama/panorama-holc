import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CityStore from '../stores/CityStore';
import RasterStore from '../stores/RasterStore';

const MapStateStore = {

	data: {
		theMap: null,
		center: [39.8333333,-98.585522],
		zoom: 5,
		bounds: null,
		visibleHOLCMaps: {},
		visibleHOLCMapsIds: [],
		visibleAdIds: [],
		adZoomThreshold: 9
	},

	loadData: function (theMap, rasters) {
		const theBounds = theMap.getBounds();
		let visibleHOLCMaps = {},
			visibleHOLCMapsIds = [],
			visibleHOLCMapsByState = {},
			visibleAdIds = [];

		Object.keys(rasters).forEach((id) => {
			if (theBounds.intersects(rasters[id].bounds) && !rasters[id].parent_id) {
				visibleHOLCMaps[id] = rasters[id];
				visibleHOLCMapsIds.push(parseInt(id));
				if (visibleAdIds.indexOf(rasters[id].ad_id) == -1) {
					visibleAdIds.push(parseInt(rasters[id].ad_id));
				}
			}
		});

		// organize by state
		visibleHOLCMapsIds.forEach((id) => {
			visibleHOLCMapsByState[visibleHOLCMaps[id].state] = (visibleHOLCMapsByState[visibleHOLCMaps[id].state]) ? visibleHOLCMapsByState[visibleHOLCMaps[id].state] : [];
			visibleHOLCMapsByState[visibleHOLCMaps[id].state].push(visibleHOLCMaps[id]);
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

		// console.log('MapStateStore finished loading');

		this.emit(AppActionTypes.storeChanged);
	},

	setView: function (zoom, center) {
		this.data.zoom = zoom;
		this.data.center = center;
		this.emit(AppActionTypes.storeChanged);
	},

	getTheMap: function() {
		return this.data.theMap;
	},

	getCenter: function() {
		return this.data.center;
	},

	getZoom: function() {
		return this.data.zoom;
	},

	getVisibleHOLCMaps: function() {
		return this.data.visibleHOLCMaps;
	},

	getVisibleHOLCMapsIds: function() {
		return this.data.visibleHOLCMapsIds;
	},

	getVisibleHOLCMapsByState() {
		return this.data.visibleHOLCMapsByState;
	},

	getVisibleAdIds: function() {
		return this.data.visibleAdIds;
	},

	isAboveZoomThreshold() {
		return this.data.zoom >= this.data.adZoomThreshold;
	}
}

// Mixin EventEmitter functionality
Object.assign(MapStateStore, EventEmitter.prototype);

// Register callback to handle all updates
MapStateStore.dispatchToken = AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			// you have to wait for RasterStore and, if a city is requested in the hash, CityStore to finish their initial load
			const waitingInitialLoad = setInterval(() => {
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
			}, 100);
			break;

		case AppActionTypes.mapInitialized:
			MapStateStore.loadData(action.theMap, action.rasters);

			// if a city has been selected (though the hash), set the new bounds
			if (CityStore.getId()) {
				const bounds = (CityStore.getPolygonsBounds()) ? CityStore.getPolygonsBounds() : RasterStore.getMapBounds(),
					newZoom = action.theMap.getBoundsZoom(bounds),
					newCenter = (CityStore.getPolygonsCenter()) ? CityStore.getPolygonsCenter() : RasterStore.getCenter();
				//MapStateStore.setView(newZoom, newCenter);
			}
			break;

		case AppActionTypes.mapMoved:
			MapStateStore.loadData(action.theMap, action.rasters);
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
	}
	return true;
});

export default MapStateStore;