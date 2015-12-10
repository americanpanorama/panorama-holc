import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';

// TODO: load this in as a panorama module
// import CartoDBLoader from '../utils/CartoDBLoader';

const ExampleStore = {

	data: [],

	// dataLoader: CartoDBLoader,

	// Sample data loader, with setTimeout
	// emulating network response delay
	dataLoader: {
		query: (value) => {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					return resolve(value);
				}, 1000);
			});
		}
	},

	getInitialData: function () {

		console.log(`[3b] ExampleStore makes a data request...`);

		// Sample query; format varies by data provider
		this.dataLoader.query([
			{
				query: "SELECT * FROM tablename",
				format: "JSON"
			}
		]).then((...responses) => {

			this.setData(this.parseData(...responses));

		},
		(error) => {

			// TODO: handle this.
			console.error("Example received error:", error);
			throw error;

		});

	},

	setData: function (...data) {

		// TODO: implement (update cached data)

		console.log(`[3b] ExampleStore updates its cache with the loaded and parsed data, and emits a '${ AppActionTypes.storeChanged }' event from ExampleStore.setData().`);
		this.emit(AppActionTypes.storeChanged);

	},

	parseData: function (...data) {

		//

	}


};

// Mixin EventEmitter functionality
Object.assign(ExampleStore, EventEmitter.prototype);

// Register callback to handle all updates
AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.getInitialData:
			console.log(`[3a] The '${ AppActionTypes.getInitialData }' event is handled by ExampleStore....`);
			ExampleStore.getInitialData(action.state);
			break;

	}

	return true;

});

export default ExampleStore;
