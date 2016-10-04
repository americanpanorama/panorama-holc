import AppDispatcher from './AppDispatcher';
import RasterStore from '../stores/RasterStore';
import AreaDescriptionsStore from '../stores/AreaDescriptionsStore';
import CitiesStore from '../stores/CitiesStore';

export const AppActionTypes = {

	// Note: stores emit this type of event.
	// Though it is not actually an Action type;
	// it's enumerated here for ease of access.
	storeChanged: 'storeChanged',

	ADCategorySelected: 'ADCategorySelected',
	ADImageOpened: 'ADImageOpened',
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
	onModalClick: 'onModalClick',
	windowResized: 'windowResized',
	stateSelected: 'stateSelected',
	countrySelected: 'countrySelected',
	mapClicked: 'mapClicked',
	toggleADView: 'toggleADView'

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

	ADImageOpened: (holcId, adId) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.ADImageOpened,
			holcId: holcId,
			adId: adId
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

	mapClicked: (mapId) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.mapClicked,
			value: mapId
		})
	},

	mapInitialized: (theMap, initialHashState) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.mapInitialized,
			theMap: theMap,
			initialHashState: initialHashState
		});
	},

	mapMoved: (theMap) => {
		// this has fired repeatedly when it should fire only once.
		// I think this might be related to re-rendering happening 
		// during leaflet animation.
		if (!AppDispatcher.isDispatching()) {
			AppDispatcher.dispatch({
				type: AppActionTypes.mapMoved,
				theMap: theMap
			});
		}
	},

	stateSelected: (abbr) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.stateSelected,
			abbr: abbr
		});
	},

	countrySelected: () => {
		AppDispatcher.dispatch({
			type: AppActionTypes.countrySelected
		});
	},

	windowResized: () => {
		AppDispatcher.dispatch({
			type: AppActionTypes.windowResized
		});
	},

	toggleADView: () => {
		AppDispatcher.dispatch({
			type: AppActionTypes.toggleADView
		});
	}
};

