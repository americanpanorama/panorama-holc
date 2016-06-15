import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';
import CitySnippet from './CitySnippet.jsx';


export default class Downloader extends React.Component {
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
		return (
			<div>
				<h2>{ this.props.stateName }</h2>
				{ this.props.cities.map((cityData) => {
					return <CitySnippet cityData={ cityData } key={ 'city' + cityData.cityId } />
				}) }
			</div>
		);
	}
}