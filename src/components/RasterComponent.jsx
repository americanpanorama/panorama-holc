import * as React from 'react';
import RasterStore from '../stores/RasterStore';
import { AppActionTypes } from '../utils/AppActionCreator';

export default class ExampleComponent extends React.Component {

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

		return (
			<div className='raster-component'>
				<h3>{this.props.title}</h3>
				<p>Initial data load {this.state.initialDataLoaded ? 'complete!' : 'pending...'}</p>
			</div>
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
RasterComponent.propTypes = {

	title: React.PropTypes.string

};

// property defaults
// (instead of ES5-style getDefaultProps)
RasterComponent.defaultProps = {

	title: 'Default Title'


}