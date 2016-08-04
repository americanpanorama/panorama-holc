import React, { PropTypes } from 'react';
import SidebarNeighborhoodNav from './SidebarNeighborhoodNav.jsx';
import SidebarNeighborhoodTitle from './SidebarNeighborhoodTitle.jsx';
import HOLCMap from './HOLCMap.jsx';

export default class SidebarMap extends React.Component {

	// property validation
	static propTypes = {

	};

	// (instead of ES5-style getDefaultProps)
	static defaultProps = {

	};

	constructor () {
		super();
	}

	shouldComponentUpdate (nextProps) {
		return true;
	}

	render () {

		return (
			<div className='areaDescription'>

				<SidebarNeighborhoodTitle
					areaId={ this.props.areaId }
					name={ this.props.neighborhoodNames[this.props.areaId] }
					onClose={ this.props.onClose }
				/>

				{ (this.props.previousAreaId) ?
					<SidebarNeighborhoodNav
						style={ this.props.previousStyle }
						onHOLCIDClick={ this.props.onHOLCIDClick } 
						areaId ={ this.props.previousAreaId } 
						name={ this.props.neighborhoodNames[this.props.previousAreaId] }
					/> :
					''
				}

				{ (this.props.nextAreaId && this.props.nextAreaId !== 'null') ?
					<SidebarNeighborhoodNav
						style={ this.props.nextStyle }
						onHOLCIDClick={ this.props.onHOLCIDClick } 
						areaId ={ this.props.nextAreaId } 
						name={ this.props.neighborhoodNames[this.props.nextAreaId] }
					/> :
					''
				}

				<div style={ this.props.mapStyle }>
					<HOLCMap
						ref='holc_map'
						state={ this.props.state }
						onMapMoved={ this.props.onMapMoved }
						onNeighborhoodPolygonClick={ this.props.onNeighborhoodPolygonClick }
						onCityMarkerSelected= { this.props.onCityMarkerSelected }
						onSliderChange={ this.props.onSliderChange }
						style={ this.props.mapStyle }
					/>
				</div>
			</div>
		);
	}

}
