import React, { PropTypes } from 'react';

export default class SidebarNeighborhoodNav extends React.Component {

	render() {

		return (
			<h2 className='sidebarTitle'>
				<span>{ this.props.areaId}</span>
				{ (this.props.name) ?
					<span>{ ' ' + this.props.name }</span> :
					''
				}

				<span className='closeicon' onClick={ this.props.onClose }>x</span>
			</h2> 
		);
	}

}