import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';
import CitySnippet from './CitySnippet.jsx';


export default class StateStats extends React.Component {
	// property validation
	static propTypes = {
		stateName: PropTypes.string
	};

	constructor () {
		super();
	}

	render () {
		return (
			<div>
				<h2>{ this.props.stateName }</h2>
				{ this.props.cities.map((cityData) => {
					return <CitySnippet 
						cityData={ cityData } 
						onCityClick={ this.props.onCityClick } 
						key={ 'city' + cityData.ad_id } 
					/>
				}) }
			</div>
		);
	}
}