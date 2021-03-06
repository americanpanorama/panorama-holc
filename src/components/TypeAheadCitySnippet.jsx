import React from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';
import CitySnippet from './CitySnippet.jsx';


export default class TypeAheadCitySnippet extends React.Component {

	constructor () {
		super();
	}

	render () {
		return (
			<div className='searchResults'>
				{ this.props.options.map((cityData) => {
					return <CitySnippet cityData={ cityData } onCityClick={ this.props.onOptionSelected } displayState={ true } key={ 'city' + cityData.ad_id } />
				}) }
			</div>
		);
	}
}