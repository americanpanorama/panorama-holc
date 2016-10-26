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
			<div className='downloads'>

			{ (this.props.hasADData) ?
				<div className='download_menu_right'>
					<h3>Area Descriptions &amp; Polygons</h3>
					<div>
						<h4>
							<a onClick={ this.props.downloadGeojson } style={{ textDecoration: 'underline' }}>GeoJson</a>
						</h4> 
						<h4>
							<a 
								href={ 'http:' + this.props.bucketPath + 'area-descriptions.zip' }
								download={ this.props.name.replace(/\s+/g, '') + '_area_descriptions.zip' }
							>
								Shapefile
							</a>
						</h4> 
					</div>
				</div> :
				null
			}

			{ (this.props.hasPolygons && !this.props.hasADData) ?
				<div className='download_menu_right'>
					<h3>Polygons</h3>
					<div>
						<h4>
							<a href={ 'http://digitalscholarshiplab.cartodb.com/api/v2/sql?q=select%20city,%20holc_polygons.the_geom,%20holc_grade,%20holc_id,%20name%20from%20holc_polygons%20join%20holc_ads%20on%20city_id=ad_id%20where%20ad_id%20=' + this.props.id + '&format=GeoJSON&filename=HOLC_' + this.props.name.replace(/\s+/g, '') }>GeoJson</a>
						</h4> 
					</div>
				</div> :
				null
			}

			{ (!this.props.hasPolygons && !this.props.hasADData) ?
				<div className='download_menu_right'>
					<h3>Area Descriptions &amp; Polygons</h3>
					<div className='ad_polygon_exp'><h3>These will be added when the area descriptions have been transcribed.</h3></div>
				</div> : 
				null
			}

			<div className='download_menu_left'>
				<h3>Maps</h3>

				{ (this.props.rasters.length == 1) ?
					<h4>
						<a 
							href={ 'http:' + this.props.rasters[0].mapUrl } 
							download={ this.props.rasters[0].name.replace(/\s+/g, '') + '_scan.zip'}
						>
							Original Scan (.jpg)
						</a>
					</h4> :
					null
				}

				{ (this.props.rasters.length > 1) ?
					<div>
						<h4>Original Scans</h4>
						<ol>
							{ this.props.rasters.map(map => {
								if (!map.inset) {
									return <li key={ 'ungeorectifiedDownload' + map.id }>
										<h3>
											<a 
												href={ 'http:' + map.mapUrl } 
												download={ map.name.replace(/\s+/g, '') + '_scan.zip'}
											>
												{ map.name } (.jpg)
											</a>
										</h3>
								</li>
								}
							}) }
						</ol>
					</div> :
					null
				}

				{ (this.props.rasters.length == 1) ?
					<h4>
						<a 
							href={ this.props.rasters[0].rectifiedUrl } 
							download={ this.props.rasters[0].name.replace(/\s+/g, '') + '_rectified.zip'}
						>
							Georectified (.zip)
						</a>
					</h4> :
					null
				}

				{ (this.props.rasters.length > 1) ?
					<div>
					<h4>Georectified</h4>
						<ol>
							{ this.props.rasters.map(map => {
								return <li key={ 'georectifiedDownload' + map.id }>
									<h3>
										<a 
											href={ map.rectifiedUrl } 
											download={ map.name.replace(/\s+/g, '') + '_rectified.zip'}
										>
											{ map.name } (.zip)
										</a>
									</h3>
								</li>
							}) }
					</ol>
					</div> :
					null
				}
			</div>


				

			</div>
		);
	}
}