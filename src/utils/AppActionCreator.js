import AppDispatcher from './AppDispatcher';

export const AppActionTypes = {

	// Note: stores emit this type of event.
	// Though it is not actually an Action type;
	// it's enumerated here for ease of access.
	storeChanged: 'storeChanged',

	loadInitialData: 'loadInitialData',
	initialDataLoaded: 'initialDataLoaded',
	getInitialData: 'getInitialData',
	citySelected: 'citySelected',
	gradeSelected: 'gradeSelected',
	neighborhoodSelected: 'neighborhoodSelected',
	ringGradeSelected: 'ringGradeSelected',
	mapMoved: 'mapMoved',
	userLocated: 'userLocated'

};

export const AppActions = {

	/**
	 * Load data needed by the application on init.
	 */
	loadInitialData: (state) => {
		//console.log(`[1a] A '${ AppActionTypes.loadInitialData }' event is broadcast globally from AppActionCreator.loadInitialData().`);
		AppDispatcher.dispatch({
			type: AppActionTypes.loadInitialData,
			state: state
		});
	},

	initialDataLoaded: (state) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.initialDataLoaded,
			state: state
		});
	},

	citySelected: (city, options={}) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.citySelected,
			value: city,
			options: options
		});
	},

	gradeSelected: (grade) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.gradeSelected,
			value: grade
		});
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

	mapMoved: (visibleAdIds, belowAdThreshold = false) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.mapMoved,
			value: visibleAdIds,
			belowAdThreshold: belowAdThreshold
		})
	}

	/**
	 * Dispatch action when map is zoomed or panned.
	 * @param {Object} mapState 	{ zoom, center: { lat, lng } }
	 */
	/* mapMoved: (mapState) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.mapMoved,
			value: mapState
		});
	} */

};

