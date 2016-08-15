import * as React from 'react';
import { PropTypes } from 'react';


// stores
import AreaDescriptionsStore from '../stores/AreaDescriptionsStore';
import CityStore from '../stores/CityStore';
import MapStateStore from '../stores/MapStateStore';
import RasterStore from '../stores/RasterStore';
import UserLocationStore from '../stores/UserLocationStore';

// components
import { Map, TileLayer, GeoJson, Circle, LayerGroup, Marker, setIconDefaultImagePath } from 'react-leaflet';
import { CartoDBTileLayer, Legend } from '@panorama/toolkit';
import AreaPolygon from './AreaPolygon.jsx';
import Donut from './Donut/Donut.jsx';
import Slider from 'rc-slider';


import cartodbConfig from '../../basemaps/cartodb/config.json';
import cartodbLayers from '../../basemaps/cartodb/basemaps.json';
import tileLayers from '../../basemaps/tileLayers.json';

export default class HOLCMap extends React.Component {

	constructor (props) {
		super(props);
	}

	componentWillReceiveProps(nextProps) {

	}

	componentDidMount() {
	}

	componentDidUpdate(prevProps) {
		if (this.refs.slider) {
			this.refs.slider.addEventListener('mouseover', () => {
				this.refs.the_map.leafletElement.dragging.disable();
			});
			this.refs.slider.addEventListener('mouseout', () => {
				this.refs.the_map.leafletElement.dragging.enable();
			});
		}

	}

	render () {

		const ADs = AreaDescriptionsStore.getVisible(),
			aboveThreshold = MapStateStore.isAboveZoomThreshold(),
			outerRadius = CityStore.getOuterRingRadius(),
			visibleMapsList = MapStateStore.getVisibleHOLCMapsList(),
			legendData = {
				items: [
					'A First Grade',
					'B Second Grade',
					'C Third Grade',
					'D Fourth Grade',
				]
			};

		if (!aboveThreshold) {
			legendData.items.push('Area for each grade')
		}

		return (

			<Map 
				ref='the_map' 
				center={ this.props.state.map.center } 
				zoom={ this.props.state.map.zoom }  
				onMoveend={ this.props.onMapMoved } 
				className='the_map'
			>

				{/* base map */}
				<TileLayer
					key={ (aboveThreshold) ? 'labels' : 'noLabels' }
					url={ (aboveThreshold) ? tileLayers.layers[0].urlLabels : tileLayers.layers[0].urlNoLabels }
					zIndex={ -1 }
				/>

				{/* holc tiles */}
				{ visibleMapsList.map((item, i) => {
					return (
						<TileLayer
							key={ 'holctiles' + item.id}
							className='holctiles'
							url={ item.url }
							minZoom={ item.minZoom }
							bounds= { item.bounds }
							opacity={ this.props.state.raster.opacity }
							zIndex={ (item.ad_id == this.props.state.selectedCity) ? 1 : null }
						/>
					);
				}) }

				{/* text labels for cities */}
				{ (!aboveThreshold) ?
					cartodbLayers.layergroup.layers.map((item, i) => {
						return (
							<CartoDBTileLayer
								key={ 'cartodb-tile-layer-' + i }
								userId={ cartodbConfig.userId }
								sql={ item.options.sql }
								cartocss={ item.options.cartocss }
								zIndex={1000}
							/>
						);
					}) :
					null
				}

				{/* rings: donut holes */}
				{ (aboveThreshold && outerRadius > 0) ?
					<Circle 
						center={ CityStore.getLoopLatLng() } 
						radius={ outerRadius / 7 } 
						fillOpacity={ (this.props.state.selectedRingGrade.ringId >= 2) ? 0.75 : 0 } 
						fillColor= { '#000' } 
						clickable={ false } 
						className={ 'donuthole' } 
						key={ 'donuthole' } 
					/> :
					null
				}
			
				{/* rings: donuts */}
				{ (aboveThreshold && outerRadius > 0) ?
					[2,3,4,5].map((ringNum) => {
						return (
							<Donut 
								center={ CityStore.getLoopLatLng() } 
								innerRadius={ (ringNum * 2 - 3) / 7 * outerRadius }
								outerRadius={ (ringNum == 5) ? outerRadius * 100 : (ringNum * 2 - 1) / 7 * outerRadius}
								clickable={ false } 
								fillOpacity={ (this.props.state.selectedRingGrade.ringId > 0 && ringNum !== this.props.state.selectedRingGrade.ringId) ? 0.75 : 0 } 
								fillColor= { '#000' } 
								weight={ 1 }
								className={ 'donut' } 
								key={ 'donut' + String(ringNum) } 
							/>
						);
					}) :
					null
				}

				{/* rings: selected ring */}
				{ (aboveThreshold && this.props.state.selectedRingGrade.ringId > 0) ?
					<LayerGroup>
						<GeoJson 
							data={ CityStore.getInvertedGeoJsonForSelectedRingArea(this.props.state.selectedRingGrade.ringId, this.props.state.selectedRingGrade.grade) }
							clickable={ false }
							key={ 'invertedRingStroke'} 
							fillColor={ '#000'}
							fillOpacity={ 0.6 }
							color={ '#fff' }
							weight={ 2 }
							opacity={ 0.9 }
							className={ 'invertedRingGradedArea' }
						/>
						<GeoJson 
							data={ CityStore.getGeoJsonForSelectedRingArea(this.props.state.selectedRingGrade.ringId, this.props.state.selectedRingGrade.grade) }
							clickable={ false }
							key={ 'ringStroke'} 
							fillOpacity={ (1 - this.props.state.raster.opacity) / 2 }
							weight={ 2 }
							opacity={ 0.9 }
							className={ 'ringGradedArea grade' + this.props.state.selectedRingGrade.grade}
						/>
					</LayerGroup> :
					null
				}

				{/* selected grade */}
				{ (aboveThreshold && this.props.state.selectedGrade) ?
					<AreaPolygon 
						data={ AreaDescriptionsStore.getGeoJsonForGrade(this.props.state.selectedCity, this.props.state.selectedGrade) }
						key={ 'selectedGradedNeighborhoods' } 
						className={ 'selectedGradedNeighborhoods grade' + this.props.state.selectedGrade } 
					/> :
					null
				}

				{ (aboveThreshold && this.props.state.highlightedNeighborhood && ADs[this.props.state.selectedCity] && ADs[this.props.state.selectedCity][this.props.state.highlightedNeighborhood] && ADs[this.props.state.selectedCity][this.props.state.highlightedNeighborhood].area_geojson_inverted) ?
					<AreaPolygon
						data={ ADs[this.props.state.selectedCity][this.props.state.highlightedNeighborhood].area_geojson_inverted } 
						clickable={ false }
						className={ 'neighborhoodPolygonInverted grade' + ADs[this.props.state.selectedCity][this.props.state.highlightedNeighborhood].holc_grade } 
						key={ 'neighborhoodPolygonInverted' + this.props.state.highlightedNeighborhood }
					/> :
					null
				}

				{/* selected neighborhood */}
				{ (aboveThreshold && this.props.state.selectedNeighborhood && ADs[this.props.state.selectedCity] && ADs[this.props.state.selectedCity][this.props.state.selectedNeighborhood] && ADs[this.props.state.selectedCity][this.props.state.selectedNeighborhood].area_geojson_inverted) ?
					<AreaPolygon
						data={ ADs[this.props.state.selectedCity][this.props.state.selectedNeighborhood].area_geojson_inverted } 
						clickable={ false }
						className={ 'neighborhoodPolygonInverted grade' + ADs[this.props.state.selectedCity][this.props.state.selectedNeighborhood].holc_grade } 
						key={ 'neighborhoodPolygonInverted' + this.props.state.selectedNeighborhood }
					/> :
					null
				}

				{/* neighborhood polygons: shown on zoom level 10 and higher */}
				{ (aboveThreshold) ?
					Object.keys(ADs).map(adId => {
						return (
							Object.keys(ADs[adId]).map((areaId) => {
								return (
									<AreaPolygon
										data={ ADs[adId][areaId].area_geojson }
										className={ 'neighborhoodPolygon grade' + ADs[adId][areaId].holc_grade }
										key={ 'neighborhoodPolygon' + adId + '-' + areaId } 
										onClick={ this.props.onNeighborhoodPolygonClick }
										adId={ adId }
										neighborhoodId={ areaId } 
										//fillOpacity={ (id == this.props.state.selectedNeighborhood) ? 1 : 0 }
										style={{
											opacity:(this.props.state.selectedRingGrade.ringId > 0) ? (1 - this.props.state.raster.opacity) / 5 : (1 - this.props.state.raster.opacity) / 2,
											fillOpacity: (this.props.state.selectedRingGrade.ringId > 0) ? 0 : (1 - this.props.state.raster.opacity) / 5
										}}
									/>
								);
							})
						)
					}) :
					null
				}

				{/* cartogram marker for city: shown below zoom level 10 */}
				{ (!aboveThreshold) ?
					AreaDescriptionsStore.getADsList().map((item, i) => {
						return ((item.radii && item.centerLat) ?
							Object.keys(item.radii).map((grade) => {
								return (item.radii[grade].inner == 0) ?
									<Circle
										center={ [item.centerLat, item.centerLng] }
										radius={ item.radii[grade].outer }
										id={ item.ad_id }
										onClick={ this.props.onCityMarkerSelected }
										key={ 'clickableDonut' + item.ad_id + grade }
										className={ 'simpleDonut grade_' + grade }
									/> :
									<Donut
										center={ [item.centerLat, item.centerLng] }
										innerRadius={ item.radii[grade].inner }
										outerRadius={ item.radii[grade].outer }
										id={ item.ad_id }
										onClick={ this.props.onCityMarkerSelected }
										key={ 'clickableDonut' + item.ad_id + grade }
										className={ 'simpleDonut grade_' + grade }
									/>
							}) :
							(!item.parent_id  && item.centerLat) ?
								<Circle
									center={ [item.centerLat, item.centerLng] }
									radius={ 25000 }
									id={ item.ad_id }
									onClick={ this.onCityMarkerSelected }
									key={ 'clickableMap' + item.ad_id }
									className={ 'cityCircle '}
								/> :
								null
							
						);
					}) :
					null
				}

				{/* marker for user's location */}
				{ (this.props.state.userLocation) ?
					<Marker position={ this.props.state.userLocation } /> :
					null
				}

				{/* button for national view*/}
				{ (this.props.onCountryClick) ?
					<button
						className='nationalView'
						onClick={ this.props.onCountryClick }
					>
						<img src='static/us-outline.svg' />
					</button> :
					''
				}

				{ (aboveThreshold) ?
					<div className='opacitySlider' ref='slider'>
						<Slider 
							vertical={ true }
							defaultValue={ this.props.state.raster.opacity * 100 }
							onAfterChange={ this.props.onSliderChange }
						/>
					</div> :
					''
				}

				<Legend { ...legendData } onItemSelected={ this.onGradeHover } />

			</Map>
		);
	}
}
