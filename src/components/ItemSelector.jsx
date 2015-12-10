import React, { PropTypes } from 'react';
import Leaflet from 'leaflet';

// TODO: either pass this into the component from the host application (add to panorama-template),
// or set up an AppDispatcher shared across all @panorama/toolkit components.
import { AppActions } from '../utils/AppActionCreator';

export default class ItemSelector extends React.Component {

	static propTypes = {
		initialSelection: PropTypes.string,
		items: PropTypes.array.isRequired
	}

	static defaultProps = {
		initialSelection: '',
		items: {}
	}

	constructor (props) {

		super(props);

		// manually bind event handlers,
		// since React ES6 doesn't do this automatically
		this.onItemClick = this.onItemClick.bind(this);

	}

	componentWillMount () {

		//

	}

	componentDidMount () {

		//

	}

	componentWillUnmount () {

		//

	}

	componentDidUpdate () {

		//

	}

	onItemClick (event) {

		// Defense.
		if (!event.currentTarget || !event.currentTarget.dataset) { return; }

		// TODO: how to abstract this? AppActions for @panorama/toolkit? and set up CommodityStore to listen to it?
		AppActions.citySelected(event.currentTarget.dataset.item);
	}

	getDefaultState () {

		return {};

	}

	render () {
		return (
			<div className='panorama item-selector'>
				<ul>
				{ this.props.items.map((item, i) => {
					return (
						<li
							className = { 'item' }
							data-item = { item.cityId }
							key = { i }
							onClick = { this.onItemClick }
						>
							<span>{ item.display }</span>
						</li>
					);
				}) }
				</ul>
			</div>
		);

	}

}
