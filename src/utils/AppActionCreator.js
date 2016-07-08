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
	ringAreaSelected: 'ringAreaSelected',
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

	stateSelected: (state) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.stateSelected,
			value: state
		});
	},

	ringAreaSelected: (ringId, grade) => {
		console.log(`[1a] A '${ AppActionTypes.ringAreaSelected }' event is broadcast globally from AppActionCreator.loadInitialData().`);
		AppDispatcher.dispatch({
			type: AppActionTypes.ringAreaSelected,
			value: {ringId: ringId, grade: grade}
		});
	},

	mapMoved: (visibleMaps) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.mapMoved,
			value: visibleMaps
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

