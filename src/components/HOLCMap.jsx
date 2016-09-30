import * as React from 'react';
import { PropTypes } from 'react';
import * as L from 'leaflet';

// stores
import AreaDescriptionsStore from '../stores/AreaDescriptionsStore';
import CitiesStore from '../stores/CitiesStore';
import CityStore from '../stores/CityStore';
import MapStateStore from '../stores/MapStateStore';
import RasterStore from '../stores/RasterStore';
import UserLocationStore from '../stores/UserLocationStore';

// components
import { Map, TileLayer, GeoJson, Circle, LayerGroup, Marker, setIconDefaultImagePath } from 'react-leaflet';
import { CartoDBTileLayer, Legend } from '@panorama/toolkit';
//import CartoDBTileLayer from './CartoDBTileLayer.jsx';
//import { CartoDBTileLayerProd, Legend } from '../../../panorama';
import AreaPolygon from './AreaPolygon.jsx';
import Donut from './Donut/Donut.jsx';
import Slider from 'rc-slider';


import cartodbConfig from '../../basemaps/cartodb/config.json';
import cartodbLayers from '../../basemaps/cartodb/basemaps.json';
import tileLayers from '../../basemaps/tileLayers.json';

export default class HOLCMap extends React.Component {

	constructor (props) {
		super(props);

		this.onBringToFrontClick = this.onBringToFrontClick.bind(this);
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

		if (this.refs.neighborhoodPolygonInverted) {
			this.refs.neighborhoodPolygonInverted.leafletElement.bringToBack();

			MapStateStore.getSortOrder().forEach(mapId => {
				if (this.refs['sortingPolygon' + mapId]) {
					this.refs['sortingPolygon' + mapId].leafletElement.bringToBack();
				}
			});
		}

	}

	onBringToFrontClick (event) {
		this.refs['holctiles' + event.target.options.id].leafletElement.bringToFront();
	}

	_isRetina(){
		return ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));
	}

	_basemapUrl() {
		let url = (MapStateStore.isAboveZoomThreshold()) ? tileLayers.layers[0].urlLabels : tileLayers.layers[0].urlNoLabels;
		url = (this._isRetina()) ? url.replace('0/{z}', '{z}').replace('.png', '@2x.png') : url;
		return url;
	}

	render () {

		const ADs = AreaDescriptionsStore.getVisible(),
			aboveThreshold = MapStateStore.isAboveZoomThreshold(),
			outerRadius = CityStore.getOuterRingRadius(),
			visibleMapsList = MapStateStore.getVisibleHOLCMapsList(),
			legendData = {
				items: [
					'A "Best"',
					'B "Still Desireable"',
					'C "Definitely Declining"',
					'D "Hazardous"',
				]
			};

		if (!aboveThreshold) {
			legendData.items.unshift('Area for each grade')
		}

		return (

			<Map 
				ref='the_map' 
				center={ this.props.state.map.center } 
				zoom={ this.props.state.map.zoom }  
				onMoveend={ this.props.onMapMoved } 
				className='the_map'
				//onClick={ this.props.onMapClick }
			>

				{/* base map */}
				<TileLayer
					key={ (aboveThreshold) ? 'labels' : 'noLabels' }
					url={ this._basemapUrl() }
					zIndex={ -1 }
				/>

				{/* holc tiles */}
				{ (aboveThreshold) ?
					visibleMapsList.map((item, i) => {
						return (
							<TileLayer
								ref={ 'holctiles' + item.id } 
								key={ 'holctiles' + item.id }
								url={ (this._isRetina()) ? item.retinaUrl : item.url }
								minZoom={ item.minZoom }
								bounds= { item.bounds }
								opacity={ this.props.state.rasterOpacity }
							/>
						);
					}) :
					''
				}

				{/* polygon of map for sorting z level */}
				{ (aboveThreshold) ? 
					visibleMapsList.map((item, i) => {
						if (RasterStore.overlapsAnotherMap(item.id) && visibleMapsList.length > 1) {
							return(
								<GeoJson
									data={ RasterStore.getGeoJSON(item.id) }
									key={ 'sortPolygon' + item.id }
									id={ item.id }
									onClick={ this.props.onMapClick }
									opacity={ 0 }
									fillOpacity={ 0 }
									className='sortingPolygon'
									ref={ 'sortingPolygon' + item.id }
								/>
							);
						}
					}) :
					null
				}


				{/* rings: donut holes */}
				{ (aboveThreshold && outerRadius > 0) ?
					[1,2,3,4].map(ringNum => {
						return (
							<Circle 
								center={ CityStore.getLoopLatLng() } 
								radius={ outerRadius * (ringNum * 2 - 1) / 7 } 
								fillOpacity={ (ringNum + 1 == this.props.state.selectedRingGrade.ringId) ? 0.75 : 0 } 
								fillColor= { '#b8cdcb' } 

								clickable={ false } 
								key={ 'ring' + ringNum } 
								weight={ 1 }
								color={ '#555' }
								dashArray='10,20'
							/> 
						);
					}) :
					null
				}
			
				{/* rings: donuts */}
				{ (aboveThreshold && outerRadius > 0 && this.props.state.selectedRingGrade.ringId > 0) ?
					<Donut 
						center={ CityStore.getLoopLatLng() } 
						innerRadius={ (this.props.state.selectedRingGrade.ringId * 2 - 1) / 7 * outerRadius }
						outerRadius={ outerRadius }
						clickable={ false } 
						fillOpacity={ 0.75 } 
						fillColor= { '#b8cdcb' } 
						weight={ 1 }
						className={ 'donut' } 
						key={ 'donut' } 
					/> : 
					null
				}

				{/* rings: selected ring */}
				{ (aboveThreshold && this.props.state.selectedRingGrade.ringId > 0) ?
					<LayerGroup>
						<GeoJson 
							data={ CityStore.getInvertedGeoJsonForSelectedRingArea(this.props.state.selectedRingGrade.ringId, this.props.state.selectedRingGrade.grade) }
							clickable={ false }
							key={ 'invertedRingStroke'} 
							fillColor={ '#FFF'}
							fillOpacity={ 0.6 }
							color={ '#000' }
							weight={ 2 }
							opacity={ 0.9 }
							className={ 'invertedRingGradedArea' }
						/>
						<GeoJson 
							data={ CityStore.getGeoJsonForSelectedRingArea(this.props.state.selectedRingGrade.ringId, this.props.state.selectedRingGrade.grade) }
							clickable={ false }
							key={ 'ringStroke'} 
							fillOpacity={ (1 - this.props.state.rasterOpacity) / 2 }
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
						onClick={ this.props.onNeighborhoodInvertedPolygonClick }
						className={ 'neighborhoodPolygonInverted' } 
						key={ 'neighborhoodPolygonInverted' + this.props.state.selectedNeighborhood }
						ref='neighborhoodPolygonInverted'
					/> :
					null
				}

				{/* neighborhood polygons: shown on zoom level 10 and higher */}
				{  (aboveThreshold) ?
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
											opacity:(this.props.state.selectedRingGrade.ringId > 0) ? (1 - this.props.state.rasterOpacity) / 5 : (1 - this.props.state.rasterOpacity) / 2,
											fillOpacity: (this.props.state.selectedRingGrade.ringId > 0) ? 0 : (1 - this.props.state.rasterOpacity) / 5
										}}
									/>
								);
							})
						)
					}) :
					null
				}

				{/* cartogram marker for city: shown below zoom level 10; it's invisible but used for selection */}
				{(!aboveThreshold) ?
					CitiesStore.getADsList().map((item, i) => {
						return (!isNaN(item.centerLat) && !isNaN(item.centerLng) ?
							<Circle
								center={ [item.centerLat, item.centerLng] }
								radius={ 27000 }
								id={ item.ad_id }
								onClick={ this.props.onCityMarkerSelected }
								key={ 'clickableMap' + item.ad_id }
								className={ 'cityCircle '}
							/> :
							null
						);
					}) :
					null
				}

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
							defaultValue={ this.props.state.rasterOpacity * 100 }
							onAfterChange={ this.props.onSliderChange }
						/>
					</div> :
					''
				}

				<Legend 
					{ ...legendData } 
					className={ (!aboveThreshold) ? 'withCityMarker' : '' }
				/>

			</Map>
		);
	}
}
