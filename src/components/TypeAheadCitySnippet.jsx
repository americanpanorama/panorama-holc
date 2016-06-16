import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';
import CitySnippet from './CitySnippet.jsx';


export default class TypeAheadCitySnippet extends React.Component {
	// property validation
	static propTypes = {
		stateName: PropTypes.string
	};

	constructor () {

		super();

	}

	componentWillMount () {}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidUpdate () {}

	render () {
		console.log(this.props);
		return (
			<div>
				{ this.props.options.map((cityData) => {
					return <CitySnippet cityData={ cityData } onCityClick={ this.props.onOptionSelected } key={ 'city' + cityData.cityId } />
				}) }
			</div>
		);
	}
}