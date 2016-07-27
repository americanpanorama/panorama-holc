import AppDispatcher from './AppDispatcher';
import RasterStore from '../stores/RasterStore';
import AreaDescriptionsStore from '../stores/AreaDescriptionsStore';

export const AppActionTypes = {

	// Note: stores emit this type of event.
	// Though it is not actually an Action type;
	// it's enumerated here for ease of access.
	storeChanged: 'storeChanged',

	ADCategorySelected: 'ADCategorySelected',
	loadInitialData: 'loadInitialData',
	initialDataLoaded: 'initialDataLoaded',
	getInitialData: 'getInitialData',
	citySelected: 'citySelected',
	gradeSelected: 'gradeSelected',
	neighborhoodHighlighted: 'neighborhoodHighlighted',
	neighborhoodSelected: 'neighborhoodSelected',
	ringGradeSelected: 'ringGradeSelected',
	mapInitialized: 'mapInitialized',
	mapMoved: 'mapMoved',
	userLocated: 'userLocated',
	userRespondedToZoomOffer: 'userRespondedToZoomOffer',
	onModalClick: 'onModalClick'

};

export const AppActions = {

	ADCategorySelected: (value) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.ADCategorySelected,
			value: value
		});
	},

	/**
	 * Load data needed by the application on init.
	 */
	loadInitialData: (state, hashState) => {
		//console.log(`[1a] A '${ AppActionTypes.loadInitialData }' event is broadcast globally from AppActionCreator.loadInitialData().`);
		AppDispatcher.dispatch({
			type: AppActionTypes.loadInitialData,
			state: state,
			hashState: hashState
		});
	},

	initialDataLoaded: (state) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.initialDataLoaded,
			state: state
		});
	},

	citySelected: (city, selectedByUser = false) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.citySelected,
			value: city,
			selectedByUser: true
		});
	},

	gradeSelected: (grade) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.gradeSelected,
			value: grade
		});
	},

	neighborhoodHighlighted: (holcId, adId) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.neighborhoodHighlighted,
			holcId: holcId
		})
	},

	neighborhoodSelected: (holcId, adId) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.neighborhoodSelected,
			holcId: holcId,
			adId: adId
		})
	},

	stateSelected: (state) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.stateSelected,
			value: state
		});
	},

	ringGradeSelected: (selectedRingGrade) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.ringGradeSelected,
			value: selectedRingGrade
		});
	},

	// mapMoved: (visibleAdIds, belowAdThreshold = false) => {
	// 	AppDispatcher.dispatch({
	// 		type: AppActionTypes.mapMoved,
	// 		value: visibleAdIds,
	// 		belowAdThreshold: belowAdThreshold
	// 	})
	// },

	onModalClick: (subject) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.onModalClick,
			subject: subject
		})
	},

	userLocated: (point) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.userLocated,
			point: point
		});
	},

	userRespondedToZoomOffer: () => {
		AppDispatcher.dispatch({
			type: AppActionTypes.userRespondedToZoomOffer
		});
	},

	mapInitialized: (theMap) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.mapInitialized,
			theMap: theMap,
			rasters: RasterStore.getAllRasters(),
			adsMetadata: AreaDescriptionsStore.getADsMetadata()
		});
	},

	mapMoved: (theMap) => {
		// this has fired repeatedly when it should fire only once.
		// I think this might be related to re-rendering happening 
		// during leaflet animation.
		if (!AppDispatcher.isDispatching()) {
			AppDispatcher.dispatch({
				type: AppActionTypes.mapMoved,
				theMap: theMap,
				rasters: RasterStore.getAllRasters(),
				adsMetadata: AreaDescriptionsStore.getADsMetadata()
			});
		}
	}
};

