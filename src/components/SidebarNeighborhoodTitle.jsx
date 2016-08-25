import React, { PropTypes } from 'react';

export default class SidebarNeighborhoodNav extends React.Component {

	render() {

		return (
			<h2 className='sidebarTitle'>
				<a
					href={'//dsl.richmond.edu/panorama/redlining/#city=' + this.props.citySlug + '&area=' + this.props.areaId }
					onClick={ (event)=>{ event.preventDefault() } }
				>
					{ (this.props.name) ?
						this.props.areaId + ' ' + this.props.name :
						this.props.areaId
					}
				</a>

				<span className='closeicon' onClick={ this.props.onClose }>x</span>
			</h2> 
		);
	}

}