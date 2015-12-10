import * as React from 'react';
import RasterStore from '../stores/RasterStore';
import { TileLayer } from 'react-leaflet';
import { AppActionTypes } from '../utils/AppActionCreator';

export default class HolcTileLayers extends React.Component {

	constructor () {

		super();

		// set up initial state (instead of ES5-style getInitialState)
		this.state = {
			initialDataLoaded: false
		};

		// bind handlers to this component instance,
		// since React no longer does this automatically when using ES6
		this.storeChanged = this.storeChanged.bind(this);

	}

	componentWillMount () {

		//

	}

	componentDidMount () {

		// Listen for data changes
		RasterStore.addListener(AppActionTypes.storeChanged, this.storeChanged);

	}

	componentWillUnmount () {

		RasterStore.removeListener(AppActionTypes.storeChanged, this.storeChanged);

	}

	componentDidUpdate () {

		//

	}

	render () {
		console.log('HolcTileLayers rendered');

		return (
			<TileLayer
				url="http://holc.s3-website-us-east-1.amazonaws.com/tiles/LA/NewOrleans/1939/{z}/{x}/{y}.png"
			/>
		);

	}

	storeChanged () {

		console.log(`[4] The data requested on app init land in the view that will render them, in ExampleComponent.storeChanged(). A setState() call updates the data and triggers a render().`);

		// setState with the updated data, which causes a re-render()
		this.setState({
			initialDataLoaded: true
		});

	}

}

// property validation
HolcTileLayers.propTypes = {

	title: React.PropTypes.string

};

// property defaults
// (instead of ES5-style getDefaultProps)
HolcTileLayers.defaultProps = {

	title: 'Default Title'


}