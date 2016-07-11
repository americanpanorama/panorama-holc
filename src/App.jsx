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
import { CartoDBTileLayer, HashManager, Legend, IntroManager, Navigation } from '@panorama/toolkit';
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
		const handlers = ['onWindowResize','onModalClick','toggleBurgessDiagram','storeChanged','onBurgessChartOff','onBurgessChartHover','onStateSelected','onCitySelected','triggerIntro','onIntroExit','onMapMoved','onPanoramaMenuClick','onDownloadClicked','onCategoryClick','neighborhoodHighlighted','neighborhoodsUnhighlighted','onSliderChange','onUserCityResponse','onNeighborhoodPolygonClick','onAreaChartHover','onAreaChartOff','onCityMarkerSelected','onGradeHover','onGradeUnhover','onHOLCIDClick'];
		handlers.map(handler => { this[handler] = this[handler].bind(this); });
	}

	/* Lifecycle methods */

	componentWillMount () {
		this.computeComponentDimensions();
		AppActions.loadInitialData(this.state, HashManager.getState());

		// try to retrieve the users location
		// if (navigator.geolocation) {
		// 	navigator.geolocation.getCurrentPosition((position) => {
		// 		AppActions.userLocated([position.coords.latitude, position.coords.longitude]);
		// 	}, (error) => {
		// 		console.warn('Geolocation error occurred. Error code: ' + error.code);
		// 	});
		// }
	}

	componentDidMount () {
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
		console.log('mapmoved fired');
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
			adId = event.target.options.adId;

		// clicking on a selected neighborhood deselects it
		neighborhoodId = (neighborhoodId == this.state.selectedNeighborhood) ? null : neighborhoodId

		AppActions.neighborhoodSelected(neighborhoodId, adId);
	}

	onHOLCIDClick (event) {
		console.log(event);
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

	onGradeHover (event) {
		console.log(event.target);
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

	onIntroExit () {
		this.setState({
			intro: {
				open: false
			},
			burgessDiagramVisible: false
		});
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

	triggerIntro (event) {
		if (this.state.modalSectionOpen) {
			this.closeModal();
		}

		// toggle off if the selected intro box is clicked
		if (this.state.intro.open && event && event.currentTarget && this.state.intro.step == parseInt(event.currentTarget.dataset.step)) {
			this.setState({intro: {open: false}});
			return;
		}

		this.setState({
			intro: {
				open: true,
				step: (event && event.currentTarget) ? parseInt(event.currentTarget.dataset.step) : null,
				config: {
					showStepNumbers: false,
					skipLabel: '×',
					nextLabel: '⟩',
					prevLabel: '⟨',
					doneLabel: '×'
				},
				steps: appConfig.introSteps,
				onExit: this.onIntroExit
			}
		});
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
			dimensions = {};

		dimensions.search = {
			width: window.innerWidth / 3 - 2 * containerPadding,
			height: window.innerHeight - 2 * containerPadding
		};

		dimensions.bottom = {
			height: window.innerHeight - headerHeight - 2 * containerPadding
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

	renderSidebar() {
		let title, content, theClass, ADs, ADsByCat;
		// if (AreaDescriptionsStore.data.areaDescriptions && AreaDescriptionsStore.data.areaDescriptions[this.state.selectedCity]) {
		// 	console.log(AreaDescriptionsStore.data.areaDescriptions[this.state.selectedCity].byCategory);
		// }
		if (this.state.selectedCity) {
			if (this.state.selectedNeighborhood) {
				ADs = AreaDescriptionsStore.getADsForNeighborhood(this.state.selectedCity, this.state.selectedNeighborhood)
			} else if (this.state.selectedCategory) {
				ADsByCat = AreaDescriptionsStore.getADsForCategory(this.state.selectedCity, this.state.selectedCategory);
			}
		}

		if (this.state.downloadOpen) {
			title = 	<h2>
							{ (typeof(RasterStore.getSelectedCityMetadata()) != 'undefined') ? RasterStore.getSelectedCityMetadata().name : '' }
							<div className='downloadicon' href='#' onClick={ this.onDownloadClicked }></div>
						</h2>;
			content = <Downloader mapurl={ RasterStore.getMapUrl() } name={ RasterStore.getSelectedCityMetadata().name } />;
		} else if (this.state.selectedNeighborhood && ADs) {
			theClass = 'area';
			title = 	<h2>
							<span>{ CityStore.getName() + ', '}</span> 
							<span 
								onClick={ this.onStateSelected } 
								id={ CityStore.getState() }
							>
								{ CityStore.getState() }
							</span>
							<div className='downloadicon' href='#' onClick={ this.onDownloadClicked }></div>
						</h2>;
			content = 	<AreaDescription 
							areaId={ this.state.selectedNeighborhood } 
							previousAreaId={ AreaDescriptionsStore.getPreviousHOLCId(this.state.selectedCity, this.state.selectedNeighborhood) }
							nextAreaId={ AreaDescriptionsStore.getNextHOLCId(this.state.selectedCity, this.state.selectedNeighborhood) }
							areaDescriptions={ ADs } 
							formId={ CityStore.getFormId() } 
							cityId={ this.state.selectedCity }
							onCategoryClick={ this.onCategoryClick } 
							onHOLCIDClick={ this.onHOLCIDClick } 
							ref={'areadescription' + this.state.selectedNeighborhood } 
						/>;
		} else if (this.state.selectedCategory && ADsByCat) {
			let [catNum, catLetter] = this.state.selectedCategory.split('-');
			theClass = 'category';
			title = 	<h2>
							<span>{ CityStore.getName() + ', '}</span> 
							<span 
								onClick={ this.onStateSelected } 
								id={ CityStore.getState() }
							>
								{ CityStore.getState() }
							</span>
							<div className='downloadicon' href='#' onClick={ this.onDownloadClicked }></div>
						</h2>;
			content = 	<ADCat 
							ADsByCat={ ADsByCat }
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
						/>;
		} else if (this.state.selectedCity) {
			theClass = 'city';
			title = 	<h2>
							<span>{ CityStore.getName() + ', '}</span> 
							<span 
								onClick={ this.onStateSelected } 
								id={ CityStore.getState() }
							>
								{ CityStore.getState() }
							</span>
							<div className='downloadicon' href='#' onClick={ this.onDownloadClicked }></div>
						</h2>;
			content = 	<CityStats 
							cityData={ CityStore.getCityData() } 
							area={ AreaDescriptionsStore.getArea(this.state.selectedCity) } 
							gradeStats={ CityStore.getGradeStats() } 
							ringStats={ CityStore.getRingStats() } 
							areaSelected={ this.onBurgessChartHover } 
							areaUnselected={ this.onBurgessChartOff } 
							gradeSelected={ this.onAreaChartHover } 
							gradeUnselected={ this.onAreaChartOff } 
							triggerIntro={ this.triggerIntro } 
							burgessDiagramVisible={ this.state.burgessDiagramVisible } 
							toggleBurgessDiagram={ this.toggleBurgessDiagram } 
							hasADs={ AreaDescriptionsStore.hasADData(this.state.selectedCity) }
						/>;
		} else if (!this.state.selectedCity) {
			theClass = 'state';
			let visibleStates = MapStateStore.getVisibleHOLCMapsByState();
			if (MapStateStore.getVisibleHOLCMapsIds().length >= 2) {
				content = 	Object.keys(visibleStates).map((theState) => {
					return <StateStats 
						stateName={ stateAbbrs[theState] } 
						cities={ visibleStates[theState] } 
						onCityClick={ this.onCitySelected }  
						key={ theState }
					/>;
				});
			}
		}


		return (
			<div className={ theClass } key={ theClass }>
				{ title }
				{ content }
			</div>
		);
	}

	render () {
		//console.log(this.state);
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
							<h4 onClick={ this.openModalClick } id={ 'credits' }>Credits</h4>
							<hr className='style-eight'>
							</hr>
							<button className='intro-button' data-step='1' onClick={ this.triggerIntro }>
								<span className='icon info'/>
							</button>
						</header>
						<div className='row template-tile leaflet-container' style={{height: this.state.dimensions.bottom.height + 'px'}}>
							<Map 
								ref='the_map' 
								center={ this.state.map.center } 
								zoom={ this.state.map.zoom }  
								onMoveend={ this.onMapMoved } 
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
											/>
										);
									}
								}) }

								{ cartodbLayers.layergroup.layers.map((item, i) => {
									return (
										<CartoDBTileLayer
											key={ 'cartodb-tile-layer-' + i }
											userId={ cartodbConfig.userId }
											sql={ item.options.sql }
											cartocss={ item.options.cartocss }
											zIndex={1000}
										/>
									);
								}) }

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
														key={ 'neighborhoodPolygon' + areaId } 
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
											<Circle
												center={ [item.centerLat, item.centerLng] }
												radius={ 25000 }
												id={ item.cityId }
												onClick={ this.onCityMarkerSelected }
												key={ 'clickableMap' + item.cityId }
												className={ 'cityCircle '}
											/> 
										);
									}) :
									null
								}

								{/* marker for user's location */}
								{ (this.state.userLocation) ?
									<Marker position={ this.state.userLocation } /> :
									null
								}



							</Map>
						</div>
					</div>

                	 <div className='map-legend-wrapper' onClick={this.onListItemClick}>
				        <ul>
				          <li className={"item narratives"} data-item-type="narratives"><span>Grading and Density</span></li>
				          <li 
				          	className={"item first"} 
				          	data-item-type="first">
				          	<span 
				          		onMouseOver={ this.onGradeHover }
				          		onMouseOut={ this.onGradeUnhover }
				          		grade='A'
				          	>
				          		A First Grade
				          	</span>
				          </li>
				          <li className={"item second"} data-item-type="second"><span>B Second Grade</span></li>
				          <li className={"item third"} data-item-type="third"><span>C Third Grade</span></li>
				          <li className={"item fourth"} data-item-type="fourth"><span>D Fourth Grade</span></li>
				        </ul>
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
							{ this.renderSidebar() }

						</div>
					</div>
					
					<Modal 
						isOpen={ TextsStore.mainModalIsOpen() } 
						style={ modalStyle }
					>
						<button className='close' onClick={ this.onModalClick }><span>×</span></button>
						<div dangerouslySetInnerHTML={ TextsStore.getModalContent() }></div>
					</Modal>

					<Modal 
						isOpen={ UserLocationStore.getOfferZoomTo() } 
						style={ modalStyle }
					>
						<p>Would you like to zoom to { UserLocationStore.getCity() }?</p>
						<button onClick={ this.onUserCityResponse } value={ 'yes' }>Sure</button>
						<button onClick={ this.onUserCityResponse } value={ 'no' }>No thanks</button>
					</Modal>



					<IntroManager { ...this.state.intro } />
				</div>
			</div> 
		);

	}
}