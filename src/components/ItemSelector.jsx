import React, { PropTypes } from 'react';
import { ItemSelector } from '@panorama/toolkit';

export default class HolcItemSelector extends React.Component {

	// property validation
	static propTypes = {
	};

	// (instead of ES5-style getDefaultProps)
	static defaultProps = {
		areaDescriptions: {}
	};

	constructor () { 
		super();
	}

	componentWillMount () {}

	componentDidMount () {
		this.onCitySelected = this.props.onItemSelected.bind(this);
		this.onStateSelected = this.props.onStateSelected.bind(this);
	}

	componentWillUnmount () {}

	componentDidUpdate () {}

	getCitySelectorConfig() {
		return {
			title: this.props.title,
			items: this.props.items,
			selectedItem: this.props.selectedItem,
			onItemSelected: this.onCitySelected
		};
	}

	getStateSelectorConfig() {
		return {
			title: this.props.title,
			items: this.props.stateItems,
			selectedItem: this.props.selectedStateItem,
			onItemSelected: this.onStateSelected
		};
	}

	render () {
		return (
			<div className='row full-height'>
				<div className='columns six full-height cities'>
					<ItemSelector { ...this.getCitySelectorConfig() } />
				</div>
				<div className='columns six full-height states'>
					<ItemSelector { ...this.getStateSelectorConfig() } />
				</div>
			</div>
		);
	}
}