import AppDispatcher from './AppDispatcher';

export const AppActionTypes = {

	// Note: stores emit this type of event.
	// Though it is not actually an Action type;
	// it's enumerated here for ease of access.
	storeChanged: 'storeChanged',

	loadInitialData: 'loadInitialData',
	getInitialData: 'getInitialData',
	citySelected: 'citySelected',
	ringAreaSelected: 'ringAreaSelected'

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

	citySelected: (city) => {
		AppDispatcher.dispatch({
			type: AppActionTypes.citySelected,
			value: city
		});
	},

	ringAreaSelected: (ringId, grade) => {
		console.log(`[1a] A '${ AppActionTypes.ringAreaSelected }' event is broadcast globally from AppActionCreator.loadInitialData().`);
		AppDispatcher.dispatch({
			type: AppActionTypes.ringAreaSelected,
			value: {ringId: ringId, grade: grade}
		});
	}

};

