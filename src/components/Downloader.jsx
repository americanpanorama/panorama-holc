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
							<a href={ 'http://digitalscholarshiplab.cartodb.com/api/v2/sql?q=with%20condensed_data%20as%20(with%20ad_data%20as%20(SELECT%20holc_polygons.the_geom%2C%20holc_polygons.name%2C%20holc_id%2C%20holc_grade%2C%20cat_id%2C%20sub_cat_id%2C%20_order%2C%20data%20FROM%20holc_ad_data%20right%20join%20holc_polygons%20on%20holc_ad_data.polygon_id%20%3D%20holc_polygons.neighborhood_id%20join%20holc_ads%20on%20city_id%20%3D%20holc_polygons.ad_id%20where%20holc_ads.city_id%20%3D%20' + this.props.id + '%20%20order%20by%20holc_id%2C%20cat_id%2C%20sub_cat_id%2C%20_order)%20SELECT%20the_geom%2C%20name%2C%20holc_id%2C%20holc_grade%2C%20concat(cat_id%2C%20sub_cat_id)%20as%20the_id%2C%20array_to_string(array_agg(data)%2C%20%27%20%27)%20as%20the_data%20FROM%20ad_data%20group%20by%20the_geom%2C%20name%2C%20holc_id%2C%20holc_grade%2C%20cat_id%2C%20sub_cat_id%20order%20by%20holc_id%2C%20the_id)%20select%20the_geom%2C%20name%2C%20holc_id%2C%20holc_grade%2C%20json_object_agg(the_id%2C%20the_data)%20AS%20area_description_data%20from%20condensed_data%20group%20by%20the_geom%2C%20name%2C%20holc_id%2C%20holc_grade%20order%20by%20holc_id&format=GeoJSON&filename=HOLC_' + this.props.name.replace(/\s+/g, '') }>GeoJson</a>
						</h4> 
						<h4>
							<a href={ 'http://digitalscholarshiplab.cartodb.com/api/v2/sql?q=with%20condensed_data%20as%20(with%20ad_data%20as%20(SELECT%20holc_polygons.the_geom%2C%20holc_polygons.name%2C%20holc_id%2C%20holc_grade%2C%20cat_id%2C%20sub_cat_id%2C%20_order%2C%20data%20FROM%20holc_ad_data%20right%20join%20holc_polygons%20on%20holc_ad_data.polygon_id%20%3D%20holc_polygons.neighborhood_id%20join%20holc_ads%20on%20city_id%20%3D%20holc_polygons.ad_id%20where%20holc_ads.city_id%20%3D%20' + this.props.id + '%20%20order%20by%20holc_id%2C%20cat_id%2C%20sub_cat_id%2C%20_order)%20SELECT%20the_geom%2C%20name%2C%20holc_id%2C%20holc_grade%2C%20concat(cat_id%2C%20sub_cat_id)%20as%20the_id%2C%20array_to_string(array_agg(data)%2C%20%27%20%27)%20as%20the_data%20FROM%20ad_data%20group%20by%20the_geom%2C%20name%2C%20holc_id%2C%20holc_grade%2C%20cat_id%2C%20sub_cat_id%20order%20by%20holc_id%2C%20the_id)%20select%20the_geom%2C%20name%2C%20holc_id%2C%20holc_grade%2C%20json_object_agg(the_id%2C%20the_data)%20AS%20area_description_data%20from%20condensed_data%20group%20by%20the_geom%2C%20name%2C%20holc_id%2C%20holc_grade%20order%20by%20holc_id&format=SHP&filename=HOLC_' + this.props.name.replace(/\s+/g, '') }>
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
						<h4>
							<a href={ 'http://digitalscholarshiplab.cartodb.com/api/v2/sql?q=select%20city,%20holc_polygons.the_geom,%20holc_grade,%20holc_id,%20name%20from%20holc_polygons%20join%20holc_ads%20on%20city_id=ad_id%20where%20ad_id%20=' + this.props.id + '&format=SHP&filename=HOLC_' + this.props.name.replace(/\s+/g, '') }>Shapefile</a>
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


			<div
				style={{
					textAlign: 'center',
					margin: '10px auto',
					clear: 'both'
				}}
			>
				<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
					<img alt="Creative Commons License" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a>
					<br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.
			</div>

			</div>
		);
	}
}