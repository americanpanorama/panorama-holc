import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';


export default class Downloader extends React.Component {
	// property validation
	static propTypes = {
		mapurl: PropTypes.string,
		name: PropTypes.string
	};

	constructor () {
		super();
	}

	render () {
		return (
			<div className='download_menu'>
			<ul>
				<li>
					<h3><a href={this.props.mapurl} download={ this.props.name + 'HOLCMap.jpg'}>Download HOLC map</a></h3>
					<img src={this.props.mapThumbnail } />
				</li>
				<li>
					<h3><a href={this.props.mapurl} download={ this.props.name + 'HOLCMap.jpg'}>Download HOLC area description</a></h3>
					<img src={this.props.mapThumbnail } />
				</li>
				<li>
					<h3><a href={this.props.mapurl} download={ this.props.name + 'HOLCMap.jpg'}>Download HOLC georeferenced map</a></h3>
					<img src={this.props.mapThumbnail } />
				</li>
			</ul>
			</div>
		);
	}
}