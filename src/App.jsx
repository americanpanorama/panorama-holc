import * as React from 'react';
//import "babel-polyfill";

// stores
import AreaDescriptionsStore from './stores/AreaDescriptionsStore';
import CityStore from './stores/CityStore';
import MapStateStore from './stores/MapStateStore';
import RasterStore from './stores/RasterStore';
import UserLocationStore from './stores/UserLocationStore';
import TextsStore from './stores/TextsStore';

// components (views)
import ADCat from './components/ADCat.jsx';
import AreaDescription from './components/AreaDescription.jsx';
import AreaPolygon from './components/AreaPolygon.jsx';
import { CartoDBTileLayer, HashManager, Legend, Navigation } from '@panorama/toolkit';
import CitySnippet from './components/CitySnippet.jsx';
import CityStats from './components/CityStats.jsx';
import Donut from './components/Donut/Donut.jsx';
import Downloader from './components/Downloader.jsx';
import { icon } from 'leaflet';
import { Map, TileLayer, GeoJson, Circle, LayerGroup, Marker, setIconDefaultImagePath } from 'react-leaflet';
import Modal from 'react-modal';
import Slider from 'rc-slider';
import StateStats from './components/StateStats.jsx';
import { Typeahead } from 'react-typeahead';
import TypeAheadCitySnippet from './components/TypeAheadCitySnippet.jsx';

// utils
import { AppActions, AppActionTypes } from './utils/AppActionCreator';

// config
import cartodbConfig from '../basemaps/cartodb/config.json';
import cartodbLayers from '../basemaps/cartodb/basemaps.json';
import tileLayers from '../basemaps/tileLayers.json';

// data
import panoramaNavData from '../data/panorama_nav.json';
import stateAbbrs from '../data/state_abbr.json';


export default class App extends React.Component {

	static defaultProps = {
		somethingRequested: Object.keys(HashManager.getState()).reduce((a,b) => (typeof a !== 'undefined' && typeof HashManager.getState()[a] !== 'undefined') || (typeof b !== 'undefined' && typeof HashManager.getState()[b] !== 'undefined'), '')
	};

	constructor (props) {
		super(props);
		this.state = this.getDefaultState();

		// bind handlers
		const handlers = ['onWindowResize','onModalClick','toggleBurgessDiagram','storeChanged','onBurgessChartOff','onBurgessChartHover','onStateSelected','onCitySelected','onMapMoved','onPanoramaMenuClick','onDownloadClicked','onCategoryClick','neighborhoodHighlighted','neighborhoodsUnhighlighted','onSliderChange','onUserCityResponse','onNeighborhoodPolygonClick','onAreaChartHover','onAreaChartOff','onCityMarkerSelected','onGradeHover','onGradeUnhover','onHOLCIDClick','onNeighborhoodClose','onCategoryClose','onAdImageClicked'];
		handlers.map(handler => { this[handler] = this[handler].bind(this); });
	}

	/* Lifecycle methods */

	componentWillMount () {
		this.computeComponentDimensions();
		AppActions.loadInitialData(this.state, HashManager.getState());

		//try to retrieve the users location
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((position) => {
				AppActions.userLocated([position.coords.latitude, position.coords.longitude]);
			}, (error) => {
				console.warn('Geolocation error occurred. Error code: ' + error.code);
			});
		}
	}

	componentDidMount () {
		this.computeComponentDimensions();

		window.addEventListener('resize', this.onWindowResize);
		AreaDescriptionsStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		CityStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		MapStateStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		RasterStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		UserLocationStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		TextsStore.addListener(AppActionTypes.storeChanged, this.storeChanged);

		// you have to wait until there's a map to query to get the visible maps
		const waitingId = setInterval(() => {
			if (RasterStore.hasLoaded()) {
				clearInterval(waitingId);

				// emit mapped moved event to initialize map state
				AppActions.mapInitialized(this.refs.the_map.leafletElement);
			}
		}, 100);
	}

	componentWillUnmount () { }

	componentDidUpdate () {}

	/* setState methods */

	getDefaultState () {
		const hashState = HashManager.getState();

		return {
			selectedCity: (hashState.city) ? parseInt(hashState.city) : null, 
			selectedNeighborhood: (hashState.area) ? hashState.area : null,
			selectedCategory: (hashState.category) ? hashState.category : null,
			selectedRingGrade: { 
				ringId: null, 
				grade: null
			},
			selectedGrade: null,
			raster: {
				opacity: (hashState.opacity) ? parseFloat(hashState.opacity) : 0.8
			},
			highlightedNeighborhood: null,
			burgessDiagramVisible: false,
			downloadOpen: false,
			adImageOpen: false,
			map: {
				zoom: (hashState.loc && hashState.loc.zoom) ? hashState.loc.zoom : 5,
				center: (hashState.loc && hashState.loc.center) ? [hashState.loc.center[0], hashState.loc.center[1]] : [39.8333333,-98.585522]
			},
			dimensions: {
				left: {
					width: 0,
					height: 0
				},
				upperRight: {
					width: 0,
					height: 0
				}
			}
		};
	}

	storeChanged (options = {}) {
		this.setState({
			selectedCity: CityStore.getId(),
			selectedGrade: CityStore.getSelectedGrade(),
			selectedNeighborhood: CityStore.getSelectedHolcId(),
			selectedCategory: CityStore.getSelectedCategory(),
			selectedRingGrade: CityStore.getSelectedRingGrade(),
			highlightedNeighborhood: CityStore.getHighlightedHolcId(),
			map: {
				center: MapStateStore.getCenter(),
				zoom: MapStateStore.getZoom()
			}
		}, this.changeHash); 
	}

	onMapMoved (event) {
		AppActions.mapMoved(this.refs.the_map.leafletElement);
	}

	onCitySelected (event) {
		AppActions.citySelected(event.target.id, true);
	}

	onCityMarkerSelected (event) {
		AppActions.citySelected(event.target.options.id, true);
	}

	onNeighborhoodPolygonClick (event) {
		let neighborhoodId = event.target.options.neighborhoodId,
			adId = parseInt(event.target.options.adId);

		// clicking on a selected neighborhood deselects it
		neighborhoodId = (neighborhoodId == this.state.selectedNeighborhood && adId == this.state.selectedCity) ? null : neighborhoodId

		AppActions.neighborhoodSelected(neighborhoodId, adId);
	}

	onNeighborhoodClose() {
		AppActions.neighborhoodSelected(null, this.state.selectedCity);
	}

	onHOLCIDClick (event) {
		AppActions.neighborhoodSelected(event.target.id, this.state.selectedCity);
	}

	neighborhoodHighlighted (event) {
		AppActions.neighborhoodHighlighted(event.target.id);
	}

	neighborhoodsUnhighlighted () {
		AppActions.neighborhoodHighlighted(null);
	}

	onCategoryClick (event) {
		AppActions.ADCategorySelected(event.target.id);
	}

	onCategoryClose (event) {
		AppActions.ADCategorySelected(null);
	}

	onBurgessChartHover (ringId, grade) {
		AppActions.ringGradeSelected({ringId: ringId, grade: grade});
	}

	onBurgessChartOff () {
		AppActions.ringGradeSelected({ringId: -1, grade: null});
	}

	onAreaChartHover (grade) {
		AppActions.gradeSelected(grade);
	}

	onAreaChartOff () {
		AppActions.gradeSelected(null);
	}

	onLegendSelect (legendText) {

	}

	onGradeHover (event) {
		AppActions.gradeSelected(event.target.grade);
	}

	onGradeUnhover () {
		AppActions.gradeSelected(null);
	}

	categorySelected (id) {
		this.setState({
			selectedNeighborhood: null,
			selectedCategory: id
		}, this.changeHash);
	}

	onWindowResize (event) {
		this.computeComponentDimensions();
	}

	onStateSelected (value, index) {
		// for click on state name in sidebar
		value = (value.target) ? value.target : value;
				
		this.setState({
			selectedCity: null,
			selectedNeighborhood: null,
			map: {
				zoom: this.refs.the_map.leafletElement.getBoundsZoom(RasterStore.getMapBoundsForState(value.id)),
				center: RasterStore.getCenterForState(value.id)
			}
		}, this.changeHash());
	}

	onSliderChange (value) {
		this.setState({
			raster: {
				opacity: value / 100
			}
		}, this.changeHash);
	}

	onDownloadClicked () {
		this.setState({
			downloadOpen: !this.state.downloadOpen
		});
	}

	onAdImageClicked () {
		this.setState({
			adImageOpen: !this.state.adImageOpen
		});
	}

	onPanoramaMenuClick () {
		this.setState({
			show_panorama_menu: !this.state.show_panorama_menu
		});
	}

	onUserCityResponse(event) {
		if (event.target.value == 'yes') {
			AppActions.citySelected(UserLocationStore.getAdId(), true);
		}
		AppActions.userRespondedToZoomOffer();
	}

	toggleBurgessDiagram () {
		this.setState({
			burgessDiagramVisible: !this.state.burgessDiagramVisible
		});
	}

	onModalClick (event) {
		const subject = (event.target.id) ? (event.target.id) : null;
		AppActions.onModalClick(subject);
	}

	/* manage hash */

	changeHash () {
		HashManager.updateHash({ 
			city: this.state.selectedCity,
			area: this.state.selectedNeighborhood,
			category: this.state.selectedCategory,
			opacity: this.state.raster.opacity,
			loc: {
				zoom: this.state.map.zoom,
				center: this.state.map.center
			}
		});
	}

	/* helper methods */

	computeComponentDimensions () {
		// based off of sizes stored within _variables.scss --
		// if you change them there, change them here.
		var containerPadding = 20,
			headerHeight = 100,
			bottomRowHeight = 300,
			sidebarWidth = (document.getElementsByClassName('dataViewer').length > 0) ? document.getElementsByClassName('dataViewer')[0].offsetWidth : 0,
			sidebarHeight = (document.getElementsByClassName('dataViewer').length > 0) ? document.getElementsByClassName('dataViewer')[0].offsetHeight : 0,
			mainPaneWidth = (document.getElementsByClassName('main-pane').length > 0) ? document.getElementsByClassName('main-pane')[0].offsetWidth : 0,
			adNavHeight = 20,
			dimensions = {};

		dimensions.search = {
			width: window.innerWidth / 3 - 2 * containerPadding,
			height: window.innerHeight - 2 * containerPadding
		};

		dimensions.areaChart = {
			width: window.innerWidth / 3 - 4 * containerPadding,
		};

		dimensions.bottom = {
			height: window.innerHeight - headerHeight - 2 * containerPadding
		};

		dimensions.adNav = {
			width: sidebarHeight,
			next: {
				top: (sidebarHeight + containerPadding) / 2 + headerHeight,
				right: containerPadding * 1.5 - sidebarHeight / 2
			},
			previous: {
				top: (sidebarHeight + containerPadding) / 2 + headerHeight,
				right: containerPadding * 1.5 - sidebarHeight / 2 + sidebarWidth - adNavHeight
				
			}
		};

		dimensions.adViewer = {
			height: (sidebarHeight - containerPadding * 2) + 'px',
			width: (mainPaneWidth - containerPadding * 2) + 'px'
		};

		this.setState({ dimensions: dimensions });
	}

	searchDisplay () {
		let citiesOptions = RasterStore.getCityIdsAndNames(),
			citiesData = RasterStore.getAllRasters();
		return citiesOptions.map((cityOption) => {
			return {
				id: cityOption.id,
				cityName: cityOption.cityName,
				display: <CitySnippet 
					cityData={ citiesData[cityOption.id] } 
					onCityClick={ this.props.onCityClick } 
					key={ 'citySearch' + cityOption.id } 
				/>
			}
		});
	}

	/* render and display methods */
     
	// renderSidebar() {
	// 	if (this.state.downloadOpen) {
	// 		title = 	<h2>
	// 						{ (typeof(RasterStore.getSelectedCityMetadata()) != 'undefined') ? RasterStore.getSelectedCityMetadata().name : '' }
	// 						<div className='downloadicon' href='#' onClick={ this.onDownloadClicked }></div>
	// 					</h2>;
	// 		content = <Downloader mapurl={ RasterStore.getMapUrl() } name={ RasterStore.getSelectedCityMetadata().name } />;
	// 	} 
	// }

	render () {

		let modalStyle = {
				overlay : {
					backgroundColor: null
				},
				content : {
					top: null,
					left: null,
					right: null,
					bottom: null,
					border: null,
					background: null,
					borderRadius: null,
					padding: null,
					position: null
				}
			},
			ADs = AreaDescriptionsStore.getVisible(),
			aboveThreshold = MapStateStore.isAboveZoomThreshold(),
			outerRadius = CityStore.getOuterRingRadius();

		const selectedADs = AreaDescriptionsStore.getADsForNeighborhood(this.state.selectedCity, this.state.selectedNeighborhood),
			neighborhoodNames = AreaDescriptionsStore.getNeighborhoodNames(this.state.selectedCity),
			ADsByCat = AreaDescriptionsStore.getADsForCategory(this.state.selectedCity, this.state.selectedCategory),
			catNum = (this.state.selectedCategory) ? this.state.selectedCategory.split('-')[0] : null,
			catLetter = (this.state.selectedCategory) ? this.state.selectedCategory.split('-')[1] : null,
			visibleMaps = MapStateStore.getVisibleHOLCMaps(),
			visibleStates = MapStateStore.getVisibleHOLCMapsByState();


		let legendData = {
			items: [
				'A First Grade',
				'B Second Grade',
				'C Third Grade',
				'D Third Grade',
			]
		};
		if (!MapStateStore.isAboveZoomThreshold()) {
			legendData.items.push('Proportion of Each Grade');
		}

		//setIconDefaultImagePath('./static');

		return (
			<div className='container full-height'>
				<Navigation 
					show_menu={ this.state.show_panorama_menu } 
					on_hamburger_click={ this.onPanoramaMenuClick } 
					nav_data={ panoramaNavData.filter((item, i) => item.url.indexOf('holc') === -1) } 
				/>
				<div className='row full-height'>
					<div className='columns eight full-height'>
						<header className='row u-full-width'>
							<h1>
								<span className='header-main'>Mapping Inequality</span>
								<span className='header-sub'>Redlining in New Deal America</span>
							</h1>
							<h4 onClick={ this.onModalClick } id={ 'about' }>Introduction</h4>
							<h4 onClick={ this.onModalClick } id={ 'bibliograph' }>Bibliographic Notes & Bibliography</h4>
							<h4 onClick={ this.onModalClick } id={ 'credits' }>Credits</h4>
							<hr className='style-eight' />
						</header>
						<div className='row template-tile leaflet-container main-pane' style={{height: this.state.dimensions.bottom.height + 'px'}}>
							<Map 
								ref='the_map' 
								center={ this.state.map.center } 
								zoom={ this.state.map.zoom }  
								onMoveend={ this.onMapMoved } 
								className='the_map'
							>

								{ tileLayers.layers.map((item, i) => {
									return (this.state.map.zoom < 10 ) ?
										<TileLayer
											key='noLabels'
											url={ item.urlNoLabels }
											zIndex={ -1 }
										/> : 
										<TileLayer
											key='labels'
											url={ item.urlLabels }
											zIndex={ -1 }
										/>
								}) } 

								{ RasterStore.getMapsList().map((item, i) => {
									let mapBounds = this.refs.the_map.leafletElement.getBounds();
									if (mapBounds.intersects(item.bounds)) {
										return (
											<TileLayer
												key={ 'holctiles' + i}
												className={ 'tilesForCity' + item.cityId }
												url={ item.url }
												minZoom={ item.minZoom }
												bounds= { item.bounds }
												opacity={ this.state.raster.opacity }
												zIndex={ (item.cityId == this.state.selectedCity) ? 1 : null }
											/>
										);
									}
								}) }

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
										fillOpacity={ (this.state.selectedRingGrade.ringId >= 2) ? 0.75 : 0 } 
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
												fillOpacity={ (this.state.selectedRingGrade.ringId > 0 && ringNum !== this.state.selectedRingGrade.ringId) ? 0.75 : 0 } 
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
								{ (aboveThreshold && this.state.selectedRingGrade.ringId > 0) ?
									<LayerGroup>
										<GeoJson 
											data={ CityStore.getInvertedGeoJsonForSelectedRingArea(this.state.selectedRingGrade.ringId, this.state.selectedRingGrade.grade) }
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
											data={ CityStore.getGeoJsonForSelectedRingArea(this.state.selectedRingGrade.ringId, this.state.selectedRingGrade.grade) }
											clickable={ false }
											key={ 'ringStroke'} 
											fillOpacity={ (1 - this.state.raster.opacity) / 2 }
											weight={ 2 }
											opacity={ 0.9 }
											className={ 'ringGradedArea grade' + this.state.selectedRingGrade.grade}
										/>
									</LayerGroup> :
									null
								}

								{/* selected grade */}
								{ (aboveThreshold && this.state.selectedGrade) ?
									<AreaPolygon 
										data={ AreaDescriptionsStore.getGeoJsonForGrade(this.state.selectedCity, this.state.selectedGrade) }
										key={ 'selectedGradedNeighborhoods' } 
										className={ 'selectedGradedNeighborhoods grade' + this.state.selectedGrade } 
									/> :
									null
								}

								{ (aboveThreshold && this.state.highlightedNeighborhood && ADs[this.state.selectedCity] && ADs[this.state.selectedCity][this.state.highlightedNeighborhood] && ADs[this.state.selectedCity][this.state.highlightedNeighborhood].area_geojson_inverted) ?
									<AreaPolygon
										data={ ADs[this.state.selectedCity][this.state.highlightedNeighborhood].area_geojson_inverted } 
										clickable={ false }
										className={ 'neighborhoodPolygonInverted grade' + ADs[this.state.selectedCity][this.state.highlightedNeighborhood].holc_grade } 
										key={ 'neighborhoodPolygonInverted' + this.state.highlightedNeighborhood }
									/> :
									null
								}

								{/* selected neighborhood */}
								{ (aboveThreshold && this.state.selectedNeighborhood && ADs[this.state.selectedCity] && ADs[this.state.selectedCity][this.state.selectedNeighborhood] && ADs[this.state.selectedCity][this.state.selectedNeighborhood].area_geojson_inverted) ?
									<AreaPolygon
										data={ ADs[this.state.selectedCity][this.state.selectedNeighborhood].area_geojson_inverted } 
										clickable={ false }
										className={ 'neighborhoodPolygonInverted grade' + ADs[this.state.selectedCity][this.state.selectedNeighborhood].holc_grade } 
										key={ 'neighborhoodPolygonInverted' + this.state.selectedNeighborhood }
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
														onClick={ this.onNeighborhoodPolygonClick }
														adId={ adId }
														neighborhoodId={ areaId } 
														//fillOpacity={ (id == this.state.selectedNeighborhood) ? 1 : 0 }
														style={{
															opacity:(this.state.selectedRingGrade.ringId > 0) ? (1 - this.state.raster.opacity) / 5 : (1 - this.state.raster.opacity) / 2,
															fillOpacity: (this.state.selectedRingGrade.ringId > 0) ? 0 : (1 - this.state.raster.opacity) / 5
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
									RasterStore.getMapsList().map((item, i) => {
										return ((item.radii) ?
											Object.keys(item.radii).map((grade) => {
												return (item.radii[grade].inner == 0) ?
													<Circle
														center={ [item.centerLat, item.centerLng] }
														radius={ item.radii[grade].outer }
														id={ item.cityId }
														onClick={ this.onCityMarkerSelected }
														key={ 'clickableDonut' + item.cityId + grade }
														className={ 'simpleDonut grade_' + grade }
													/> :
													<Donut
														center={ [item.centerLat, item.centerLng] }
														innerRadius={ item.radii[grade].inner }
														outerRadius={ item.radii[grade].outer }
														id={ item.cityId }
														onClick={ this.onCityMarkerSelected }
														key={ 'clickableDonut' + item.cityId + grade }
														className={ 'simpleDonut grade_' + grade }
													/>
											}) :
											(!item.parent_id) ?
												<Circle
													center={ [item.centerLat, item.centerLng] }
													radius={ 25000 }
													id={ item.cityId }
													onClick={ this.onCityMarkerSelected }
													key={ 'clickableMap' + item.cityId }
													className={ 'cityCircle '}
												/> :
												null
											
										);
									}) :
									null
								}

								{/* marker for user's location */}
								{ (this.state.userLocation) ?
									<Marker position={ this.state.userLocation } /> :
									null
								}

								<Legend { ...legendData } onItemSelected={ this.onGradeHover } />


							</Map>

							{ TextsStore.mainModalIsOpen() ?
								<div className='longishform'>
									<button className='close' onClick={ this.onModalClick }><span>×</span></button>
									<div className='content' dangerouslySetInnerHTML={ TextsStore.getModalContent() } />
								</div> :
								null
							}

							{ (false) ?
								<div className='longishform'>
									<button className='close' onClick={ this.onAdImageClicked}><span>×</span></button>
									<img src={ AreaDescriptionsStore.getAdUrl(this.state.selectedCity, this.state.selectedNeighborhood) } />
								</div> :
								null
							}

							{ (this.state.adImageOpen) ?
								<Map 
									ref='the_ad_tiles' 
									center={ [75,-125] } 
									zoom={ 3 }  
									className='the_ad'
									style={ this.state.dimensions.adViewer }
								>

									<TileLayer
										key='AD'
										url={ AreaDescriptionsStore.getAdTileUrl(this.state.selectedCity, this.state.selectedNeighborhood) }
										zIndex={ 1000 }
									/>

									
								</Map> :
								null
							}

						</div>
					</div>

					<div className='opacitySlider'>
						<Slider 
							vertical={ true }
							defaultValue={ this.state.raster.opacity * 100 }
							onAfterChange={ this.onSliderChange }
						/>
					</div>

					<div className='columns four full-height'>
						<div className='row template-tile city-selector' style={{height: this.state.dimensions.search.height + 'px', width: this.state.dimensions.search.width + 'px'}}>
							<Typeahead
								options={ RasterStore.getMapsList() }
								placeholder={ 'Search by city or state' }
								filterOption={ 'searchName' }
								displayOption={(city, i) => city.cityId }
								onOptionSelected={ this.onCitySelected }
								customListComponent={ TypeAheadCitySnippet }
								maxVisible={ 8 }
							/>
						</div>





						<div className='row full-height template-tile dataViewer' style={{height: this.state.dimensions.bottom.height + 'px'}}>

							{ (!this.state.selectedNeighborhood && !this.state.selectedCategory && !this.state.downloadOpen && this.state.selectedCity) ?
								<CityStats 
									name={ CityStore.getName() }
									state={ CityStore.getState() }
									cityData={ CityStore.getCityData() } 
									area={ AreaDescriptionsStore.getArea(this.state.selectedCity) } 
									gradeStats={ CityStore.getGradeStats() } 
									ringStats={ CityStore.getRingStats() } 
									areaSelected={ this.onBurgessChartHover } 
									areaUnselected={ this.onBurgessChartOff } 
									gradeSelected={ this.onAreaChartHover } 
									gradeUnselected={ this.onAreaChartOff } 
									openBurgess={ this.onModalClick }
									burgessDiagramVisible={ this.state.burgessDiagramVisible } 
									toggleBurgessDiagram={ this.toggleBurgessDiagram } 
									hasADs={ AreaDescriptionsStore.hasADData(this.state.selectedCity) }
									onDownloadClicked={ this.onDownloadClicked }
								/> :
								''
							}

							{ (!this.state.selectedNeighborhood && !this.state.selectedCategory && this.state.selectedCity && Object.keys(ADs).length >= 2) ?
								<div>
									<h4>Other Visible Maps</h4>
									{ Object.keys(visibleMaps).map(mapId => {
										return ((visibleMaps[mapId].cityId !== this.state.selectedCity) ?
											<CitySnippet 
												cityData={ visibleMaps[mapId] } 
												onCityClick={ this.onCitySelected } 
												key={ 'city' + mapId } 
												recenter={ false }
											/> :
											''
										)
									})} 
								</div> :
								''
							}
							

							{ (this.state.selectedNeighborhood) ? 
								<AreaDescription 
									areaId={ this.state.selectedNeighborhood } 
									previousAreaId={ AreaDescriptionsStore.getPreviousHOLCId(this.state.selectedCity, this.state.selectedNeighborhood) }
									nextAreaId={ AreaDescriptionsStore.getNextHOLCId(this.state.selectedCity, this.state.selectedNeighborhood) }
									neighborhoodNames={ neighborhoodNames }
									areaDescriptions={ selectedADs } 
									thumbnailUrl={ AreaDescriptionsStore.getThumbnailUrl(this.state.selectedCity, this.state.selectedNeighborhood) }
									formId={ CityStore.getFormId() } 
									cityId={ this.state.selectedCity }
									onCategoryClick={ this.onCategoryClick } 
									onHOLCIDClick={ this.onHOLCIDClick } 
									onAdImageClicked={ this.onAdImageClicked }
									onClose={ this.onNeighborhoodClose }
									ref={'areadescription' + this.state.selectedNeighborhood } 
									positioning={ this.state.dimensions.adNav }
								/> : 
								''
							}

							{ (this.state.selectedCategory) ?
								<ADCat 
									ADsByCat={ ADsByCat }
									neighborhoodNames={ neighborhoodNames }
									formId = { AreaDescriptionsStore.getFormId(this.state.selectedCity) }
									title={ AreaDescriptionsStore.getCatTitle(this.state.selectedCity, catNum, catLetter) }
									catNum={ catNum } 
									catLetter = { catLetter } 
									previousCatIds = { AreaDescriptionsStore.getPreviousCatIds(this.state.selectedCity, catNum, catLetter) }
									nextCatIds = { AreaDescriptionsStore.getNextCatIds(this.state.selectedCity, catNum, catLetter) }
									cityId={ this.state.selectedCity }
									onNeighborhoodClick={ this.onHOLCIDClick } 
									onCategoryClick={ this.onCategoryClick } 
									onNeighborhoodHover={ this.neighborhoodHighlighted } 
									onNeighborhoodOut={ this.neighborhoodsUnhighlighted } 
									positioning={ this.state.dimensions.adNav }
									onClose={ this.onCategoryClose }
								/> :
								''
							}

							{ (!this.state.selectedCity && !this.state.selectedNeighborhood && !this.state.selectedCategory && visibleStates) ?
								Object.keys(visibleStates).map((theState) => {
									return <StateStats 
										stateName={ stateAbbrs[theState] } 
										cities={ visibleStates[theState] } 
										onCityClick={ this.onCitySelected }
										key={ theState }
										areaChartWidth={ this.state.dimensions.areaChart.width }
									/>;
								}) :
								''
							}

							{ (this.state.downloadOpen) ?
								<Downloader 
									mapurl={ RasterStore.getMapUrl() } 
									thumbnail={ RasterStore.getMapThumbnail() }
									name={ RasterStore.getSelectedCityMetadata().name } 
									state={ CityStore.getState() }
									adGeojson={ AreaDescriptionsStore.getADsAsGeojson(this.state.selectedCity) }
									onDownloadClicked={ this.onDownloadClicked }
								/> : 
								null
							}

						</div>
					</div>

					<Modal 
						isOpen={ UserLocationStore.getOfferZoomTo() } 
						style={ modalStyle }
					>
						<p>Would you like to zoom to { UserLocationStore.getCity() }?</p>
						<button onClick={ this.onUserCityResponse } value={ 'yes' }>Sure</button>
						<button onClick={ this.onUserCityResponse } value={ 'no' }>No thanks</button>
					</Modal>
				</div>
			</div> 
		);

	}
}