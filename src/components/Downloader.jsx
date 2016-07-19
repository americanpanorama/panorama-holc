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
		this.downloadGeojson = this.downloadGeojson.bind(this); 
	}

	downloadGeojson () {
		let geojson = this.props.adGeojson;
		let blob = new Blob([JSON.stringify(geojson)]); 

		let geojsonURL = window.URL.createObjectURL(blob);
		let tempLink = document.createElement('a');
		tempLink.href = geojsonURL;
		tempLink.setAttribute('download', 'areadescription.geojson');
		tempLink.click();
	}

	render () {


		return (
			<div className='download_menu'>
				<h2>
					<span>{ this.props.name + ', ' + this.props.state }</span>

					<div onClick={ this.props.onDownloadClicked }>x</div>
				</h2>
				<ul>
					<li>
						<img src={this.props.thumbnail } />
						<h3><a href={this.props.mapurl} download={ this.props.name + 'HOLCMap.jpg'}>Download HOLC map (original)</a></h3>			
					</li>
					<li>
						<img src={this.props.mapThumbnail } />
						<h3><a onClick={ this.downloadGeojson }>Download HOLC area description</a></h3>
					</li>
					<li>
						<img src={this.props.mapThumbnail } />
						<h3><a href={this.props.mapurl} download={ this.props.name + 'HOLCMap.jpg'}>Download HOLC georeferenced map</a></h3>
					</li>
				</ul>
			</div>
		);
	}
}