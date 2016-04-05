import * as React from 'react';
import { render } from 'react-dom';
//import "babel-polyfill";
import Modal from 'react-modal';
import { Map, TileLayer, GeoJson, Circle, MultiPolygon } from 'react-leaflet';
import leafletsnogylop from 'leaflet.snogylop';

import { HashManager, Legend, IntroManager, Navigation } from '@panorama/toolkit';

// stores
import RasterStore from './stores/RasterStore';
import CityStore from './stores/CityStore';

// components (views)
import CityStats from './components/CityStats.jsx';
import AreaDescription from './components/AreaDescription.jsx';
import Downloader from './components/Downloader.jsx';
import HolcItemSelector from './components/ItemSelector.jsx';
import Donut from './components/Donut/Donut.jsx';

// utils
import { AppActions, AppActionTypes } from './utils/AppActionCreator';

// config
import appConfig from '../data/appConfig.json';
import tileLayers from '../basemaps/tileLayers.json';
import panoramaNavData from '../data/panorama_nav.json';

// main app container
export default class App extends React.Component {

	constructor (props) {
		super(props);

		// set up initial state in constructor
		// (instead of ES5-style getInitialState)
		this.state = this.getDefaultState();

		// bind handlers to this component instance,
		// since React no longer does this automatically when using ES6
		this.onWindowResize = this.onWindowResize.bind(this);
		this.hashChanged = this.hashChanged.bind(this);
		this.toggleAbout = this.toggleAbout.bind(this);
		this.toggleBurgessDiagram = this.toggleBurgessDiagram.bind(this);
		this.initialDataLoaded = this.initialDataLoaded.bind(this);
		this.storeChanged = this.storeChanged.bind(this);
		this.ringAreaSelected = this.ringAreaSelected.bind(this);
		this.ringAreaUnselected = this.ringAreaUnselected.bind(this);
		this.onCitySelected = this.onCitySelected.bind(this);
		this.onNeighborhoodClick = this.onNeighborhoodClick.bind(this);
		this.onSelectedNeighborhoodClick = this.onSelectedNeighborhoodClick.bind(this);
		this.triggerIntro = this.triggerIntro.bind(this);
		this.onIntroExit = this.onIntroExit.bind(this);
		this.onMapMoved = this.onMapMoved.bind(this);
		this.onPanoramaMenuClick = this.onPanoramaMenuClick.bind(this);
		this.onDownloadClicked = this.onDownloadClicked.bind(this); 
	}

	componentWillMount () {
		this.computeComponentDimensions();
		AppActions.loadInitialData(this.state);
	}

	componentDidMount () {
		window.addEventListener('resize', this.onWindowResize);	
		RasterStore.addListener(AppActionTypes.initialDataLoaded, this.initialDataLoaded);
		CityStore.addListener(AppActionTypes.initialDataLoaded, this.initialDataLoaded);	
		RasterStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		CityStore.addListener(AppActionTypes.storeChanged, this.storeChanged);

		// Prepare object to deliver default application state to HashManager,
		// with initial values paired with keys to use in the hash.
		let initialState = {};
		initialState.city = this.state.selectedCity;
		initialState[HashManager.MAP_STATE_KEY] = HashManager.getState(HashManager.MAP_STATE_KEY);
		HashManager.updateHash(initialState);
	}

	componentWillUnmount () { }

	componentDidUpdate () {
		this.updateCityPolygons();
		this.makeRingVisable();

		this.refs.the_map.leafletElement.options.maxZoom = (this.state.selectedCity && RasterStore.hasLoaded()) ? RasterStore.getSelectedCityMetadata('maxZoom') : null;
	}

	onWindowResize (event) {
		this.computeComponentDimensions();
	}

	getDefaultState () {
		let hashState = HashManager.getState();

		// this can be read from the url or defaults to Richmond
		return {
			selectedCity: (hashState.city) ? hashState.city : 168, // Richmond
			selectedNeighborhood: (hashState.area) ? hashState.area : null,
			rasters: {},
			ringStats: {},
			outerRingRadius: null,
			// the geometry of intersected areas and rings
			ringAreasGeometry: [],
			ringAreaSelected: {
				ringId: -1,
				grade: ''
			},
			areaDescriptions: {},
			burgessDiagramVisible: false,
			intro: {
				open: false
			},
			downloadOpen: false,
			dimensions: {
				left: {
					width: 0,
					height: 0
				},
				upperRight: {
					width: 0,
					height: 0
				}
			},
			map: {
				zoom: (hashState.loc && hashState.loc.zoom) ? hashState.loc.zoom : 12,
				center: (hashState.loc && hashState.loc.center) ? [ hashState.loc.center[0], hashState.loc.center[1] ] : [30, 90]
			}
		};
	}

	ringAreaSelected (ringNum, grade) {
		this.setState({
			ringAreaSelected: {
				ringId: ringNum,
				grade: grade
			}
		});
	}

	ringAreaUnselected () {
		this.setState({
			ringAreaSelected: {
				ringId: -1,
				grade: ""
			}
		});
	}

	neighborhoodSelected (id) {
		this.setState({ selectedNeighborhood: id });
		this.changeHash();
	}

	onCitySelected (value, index) {
		this.setState({ selectedNeighborhood: null });

		if (value && value.id) {
			AppActions.citySelected(value.id);
		}
	}

	onNeighborhoodClick (event) {
		let neighborhoodId = event.target.options.neighborhoodId;
		if (neighborhoodId !== this.state.selectedNeighborhood) {
			this.neighborhoodSelected(neighborhoodId);
		} else {
			this.neighborhoodSelected(null);
		}
	}

	onSelectedNeighborhoodClick () {
		this.neighborhoodSelected(null);
	}

	onMapMoved (event) {
		if (event && event.target) {
			AppActions.mapMoved({
				zoom: event.target.getZoom(),
				center: event.target.getCenter()
			});
		}

		let newState = {};
		newState[HashManager.MAP_STATE_KEY] = {
			zoom: event.target.getZoom(),
			center: event.target.getCenter()
		};

		HashManager.updateHash(newState);
	}

	onDownloadClicked () {
		this.setState({downloadOpen: !this.state.downloadOpen});
	}

	updateCityPolygons () {
		// Update data in GeoJson layers, as described here:
		// https://github.com/Leaflet/Leaflet/issues/1416
		let layerComponent,
			isSelected,
			styling;

		let colors = {A: '#00ff00', 'B': 'blue', 'C': 'yellow', 'D': 'red'};

		if (this.state.areaDescriptions) {
			Object.keys(this.state.areaDescriptions).map((id, i) => {
				layerComponent = this.refs['city-grade-' + this.state.selectedCity + '-' + id];
				if (layerComponent) {
					isSelected = (id == this.state.selectedNeighborhood);
					styling = {
						fillOpacity: (isSelected) ? 0.5 : 0,
						weight: (isSelected) ? 2 : 0
					}
					layerComponent.getLeafletElement().clearLayers();
					layerComponent.getLeafletElement().options.clickable = !isSelected;
					layerComponent.getLeafletElement().options.invert = isSelected; // IMPORTANT: this has to happen before data is added.
					layerComponent.getLeafletElement().addData(this.state.areaDescriptions[id].area_geojson);
					layerComponent.getLeafletElement().setStyle(styling);
				}
			});
		}

		if (this.state.selectedNeighborhood && this.refs['unselectNeighborhood']) {
			layerComponent = this.refs['unselectNeighborhood'];
			layerComponent.getLeafletElement().clearLayers();
			layerComponent.getLeafletElement().addData(this.state.areaDescriptions[this.state.selectedNeighborhood].area_geojson);
		}

		if (this.state.ringAreasGeometry) {
			this.state.ringAreasGeometry.map((item, i) => {
				layerComponent = this.refs['ring-' + item.ring_id + '-grade-' + item.holc_grade + '-id-' + item.holc_id];
				if (layerComponent) {
					isSelected = (item.ring_id == this.state.ringAreaSelected.ringId && item.holc_grade == this.state.ringAreaSelected.grade);
					styling = {
						opacity: (isSelected) ? 1 : 0,
						fillOpacity: (isSelected) ? 0.5 : 0,
						fillColor: colors[item.holc_grade],
						color: colors[item.holc_grade],
						weight: 2
					}
					layerComponent.getLeafletElement().clearLayers();
					layerComponent.getLeafletElement().addData(JSON.parse(item.the_geojson));
					layerComponent.getLeafletElement().setStyle(styling);
				}
			});
		}
	}

	// fit to window if necessary
	makeRingVisable () {

	}

	// a little different from storeChanged as the hash values are used if there are any
	initialDataLoaded () {
		this.setState({
			rasters: RasterStore.getAllRasters(),
			ringStats: CityStore.getRingStats(),
			ringAreasGeometry: CityStore.getRingAreasGeometry(),
			ringAreaSelected: CityStore.getSelectedRingAreas(),
			areaDescriptions: CityStore.getAreaDescriptions(),
			outerRingRadius: CityStore.getOuterRingRadius(),
			loopLatLng: CityStore.getLoopLatLng(),
			map: {
				center: this.getLoc(),
				zoom: this.getZoom()
			}
		});
	}

	storeChanged () {
		this.setState({
			selectedCity: RasterStore.getSelectedCityMetadata('id'),
			selectedNeighborhood: null,
			rasters: RasterStore.getAllRasters(),
			ringStats: CityStore.getRingStats(),
			ringAreasGeometry: CityStore.getRingAreasGeometry(),
			ringAreaSelected: CityStore.getSelectedRingAreas(),
			areaDescriptions: CityStore.getAreaDescriptions(),
			outerRingRadius: CityStore.getOuterRingRadius(),
			loopLatLng: CityStore.getLoopLatLng(),
			map: {
				center: [ RasterStore.getSelectedCityMetadata('centerLat'), RasterStore.getSelectedCityMetadata('centerLng')],
				zoom: this.refs.the_map.leafletElement.getBoundsZoom([ [ RasterStore.getSelectedCityMetadata('minLat'), RasterStore.getSelectedCityMetadata('minLng') ], [ RasterStore.getSelectedCityMetadata('maxLat'), RasterStore.getSelectedCityMetadata('maxLng') ] ])
			}
		});

		this.changeHash();
	}

	changeHash () {
		let newState = { 
			city: this.state.selectedCity,
			area: this.state.selectedNeighborhood 
		};
		newState[HashManager.MAP_STATE_KEY] = {
			zoom: this.state.map.zoom,
			center: this.state.map.center
		};

		HashManager.updateHash(newState);
	}

	hashChanged (event, suppressRender) {
		this.setState({
			mapState: HashManager.getState(HashManager.MAP_STATE_KEY)
		});
	}

	computeComponentDimensions () {
		// based off of sizes stored within _variables.scss --
		// if you change them there, change them here.
		var containerPadding = 20,
			headerHeight = 100,
			bottomRowHeight = 230,
			dimensions = {};

		dimensions.upperRight = {
			height: window.innerHeight - bottomRowHeight - 3 * containerPadding
		};

		dimensions.left = {
			height: window.innerHeight - headerHeight - 2 * containerPadding
		};

		this.setState({ dimensions: dimensions });
	}

	toggleAbout () {
		this.setState({
			aboutModalOpen: !this.state.aboutModalOpen
		});
	}

	toggleBurgessDiagram () {
		this.setState({
			burgessDiagramVisible: !this.state.burgessDiagramVisible
		});
	}

	triggerIntro (event) {
		if (this.state.aboutModalOpen) {
			this.toggleAbout();
		}

		// toggle off if the selected intro box is clicked
		if (this.state.intro.open && event && event.currentTarget && this.state.intro.step == parseInt(event.currentTarget.dataset.step)) {
			this.setState({intro: {open: false}})
			return;
		}

		console.log(this.state.intro);
		console.log(event);
		console.log(event.currentTarget);

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

	onIntroExit () {
		this.setState({
			intro: {
				open: false
			},
			burgessDiagramVisible: false
		});
	}

	onPanoramaMenuClick () {
		this.setState({
			show_panorama_menu: !this.state.show_panorama_menu
		});
	}

	getLoc () {
		// if it's specified in the url
		let hashState = HashManager.getState();
		if (hashState.loc && hashState.loc.center) {
			return [ hashState.loc.center[0], hashState.loc.center[1] ]
		} else {
			// otherwise use the selected city
			let rastersMetadata = RasterStore.getAllRasters();
			return (typeof rastersMetadata[this.state.selectedCity] != 'undefined') ? [ rastersMetadata[this.state.selectedCity].centerLat, rastersMetadata[this.state.selectedCity].centerLng ] : [30, 90];
		}
	}

	getZoom() {
		// if it's specified in the url
		let hashState = HashManager.getState();
		if (hashState.loc && hashState.loc.zoom) {
			return hashState.loc.zoom;
		} else {
			return this.refs.the_map.leafletElement.getBoundsZoom(RasterStore.getMapBounds());
		}
	}

	getItemSelectorConfig() {
		return {
			title: 'Select a city:',
			items: RasterStore.getCitiesList(),
			selectedItem: { id: this.state.selectedCity },
			onItemSelected: this.onCitySelected
		};
	}

	getNavData () {
		// remove the current map from the list
		return panoramaNavData.filter((item, i) => {
			return (item.url.indexOf('holc') === -1);
		});
	}

	isSelectedRing (ringNum) { return ringNum == this.state.ringAreaSelected.ringId; }

	donutShouldBeMasked (ringNum) { return this.state.ringAreaSelected.ringId > 0 && ringNum > this.state.ringAreaSelected.ringId; } 

	donutholeShouldBeMasked (ringNum) { return this.state.ringAreaSelected.ringId > 1 && ringNum == this.state.ringAreaSelected.ringId - 1; }

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
			mapConfig = this.state.map || this.state.mapConfig;

		let sidebar;
		if (this.state.downloadOpen) {
			sidebar = <Downloader mapurl={ RasterStore.getMapUrl() } name={ RasterStore.getSelectedCityMetadata().name } />
		} else if (this.state.selectedNeighborhood) {
			sidebar = <AreaDescription ref={'areadescription' + this.state.selectedNeighborhood } areaData={ this.state.areaDescriptions[this.state.selectedNeighborhood] } formId={ CityStore.getFormId() } />;
		} else {
			sidebar = <CityStats population1930={ CityStore.getPopulation1930() } population1940={ CityStore.getPopulation1940() } area={ CityStore.getArea() } ringStats={ this.state.ringStats } areaSelected={ this.ringAreaSelected } areaUnselected={ this.ringAreaUnselected } triggerIntro={ this.triggerIntro } burgessDiagramVisible={ this.state.burgessDiagramVisible } toggleBurgessDiagram={ this.toggleBurgessDiagram } />;
		}

		return (
			<div className='container full-height'>
			<Navigation show_menu={ this.state.show_panorama_menu } on_hamburger_click={ this.onPanoramaMenuClick } nav_data={ this.getNavData() }  />
				<div className='row full-height'>
					<div className='columns eight full-height'>
						<header className='row u-full-width'>
							<h1><span className='header-main'>Mapping Inequality</span><span className='header-sub'>Redlining in New Deal America</span></h1>
							<h4 onClick={ this.toggleAbout }>Introduction<div className='downloadicon' href="#"></div></h4>						
							<button className='intro-button' data-step='1' onClick={ this.triggerIntro }><span className='icon info'/></button>
						</header>
						<div className='row template-tile leaflet-container' style={{height: this.state.dimensions.left.height + "px"}}>
							<Map 
								ref="the_map" 
								center={ this.state.map.center } 
								zoom={ this.state.map.zoom }  
								onLeafletMoveend={ this.onMapMoved } 
							>
								{ tileLayers.layers.map((item, i) => {
									return (
										<TileLayer
											key={ 'basetiles' + i }
											url={ item.url }
										/>
									);
								}) }
								{ RasterStore.getMapsList().map((item, i) => {
									return (
										<TileLayer
											key={ 'holctiles' + i }
											url={ item.url }
											minZoom={ item.minZoom }
											bounds= { [[item.minLat,item.minLng],[item.maxLat,item.maxLng]]}
										/>
									);
								}) }

								{ this.renderDonuts() }
								{ this.renderDonutholes() }
								{ this.renderRingShards() }
								{ this.renderNeighborhoodPolygons() } 
							</Map>
						</div>
					</div>
					<div className='columns four full-height'>
						<div className='row top-row template-tile' style={ { height: this.state.dimensions.upperRight.height + "px" } }>
						<div className='punchcard-container'>
							<h2>{ (typeof(RasterStore.getSelectedCityMetadata()) != 'undefined') ? RasterStore.getSelectedCityMetadata().name : '' }<div className='downloadicon' href="#" onClick={ this.onDownloadClicked }></div></h2>
							{ sidebar }
							</div>
						</div>
						<div className='row bottom-row template-tile city-selector'>
							<HolcItemSelector { ...this.getItemSelectorConfig() } />
							<button className='intro-button' data-step='2' onClick={ this.triggerIntro }><span className='icon info'/></button>
						</div>
					</div>
					<Modal isOpen={ this.state.aboutModalOpen } onRequestClose={ this.toggleAbout } style={ modalStyle }>
					<button className='close' onClick={ this.toggleAbout }><span>×</span></button>
					<div dangerouslySetInnerHTML={ this.parseAboutModalCopy() }></div>
				</Modal>

				<IntroManager { ...this.state.intro } />
				</div>
			</div>
		);

	}

	renderNeighborhoodPolygons () {
		let layers = [];

		Object.keys(this.state.areaDescriptions).map((id, i) => {
			layers.push(<GeoJson 
				data={ this.state.areaDescriptions[id].area_geojson } 
				className={ 'neighborhoodPolygon grade' + this.state.areaDescriptions[id].holc_grade } 
				key={ 'neighborhoodPolygon' + id } 
				ref={ 'city-grade-' + this.state.selectedCity + '-' + id } 
				onClick={ this.onNeighborhoodClick } 
				neighborhoodId={ id } 
				fillOpacity={0}
				weight={ 0 }
			/>);
		});

		if (layers.length > 0 && this.state.selectedNeighborhood) {
			layers.push(<GeoJson
				data={ this.state.areaDescriptions[this.state.selectedNeighborhood].area_geojson }
				key={ 'unselectNeighborhood' }
				ref={ 'unselectNeighborhood' }
				onClick={ this.onSelectedNeighborhoodClick }
				stroke={ false }
				fillOpacity={ 0 }
			/>);
		}

		return layers; 
	}

	renderRingShards () {
		// this has minimal styling as that's applied after rendering by updateCityPolygons()
		let layers = [];

		this.state.ringAreasGeometry.map((item, i) => {
			layers.push(
				<GeoJson 
					data={ JSON.parse(item.the_geojson) }
					clickable={ false }
					ref={ 'ring-' + item.ring_id + '-grade-' + item.holc_grade + '-id-' + item.holc_id }
					key={ 'ringStroke' + i }
					opacity={0}
					fillOpacity={0}
				/>
			);
		});

		return layers;
	}

	renderDonuts () {
		let layers = [];

		if (this.state.outerRingRadius > 0) {
			for (let ringNum = 5; ringNum >= 2; ringNum--) {
				layers.push(
					<Donut 
						center={ this.state.loopLatLng } 
						innerRadius={ (ringNum * 2 - 3) / 7 * this.state.outerRingRadius }
						outerRadius={ (ringNum == 5) ? this.state.outerRingRadius * 100 : (ringNum * 2 - 1) / 7 * this.state.outerRingRadius}
						clickable={ false } 
						fillOpacity={ (this.isSelectedRing(ringNum)) ? 0.5 : this.donutShouldBeMasked(ringNum) ? 0.75 : 0 } 
						fillColor= { (this.isSelectedRing(ringNum)) ? 'pink' : '#000' } 
						className={ 'donut' } 
						key={ 'donut' + String(ringNum) } 
					/>
				);
			}
		}

		return layers;
	}

	renderDonutholes() {
		let layers = [];

		if (this.state.outerRingRadius > 0) {
			for (let ringNum = 3; ringNum >= 1; ringNum--) {
				layers.push(
					<Circle 
						center={ this.state.loopLatLng } 
						radius={ (ringNum * 2 - 1) / 7 * this.state.outerRingRadius } 
						fillOpacity={ (this.isSelectedRing(ringNum)) ? 0.5 : (this.donutholeShouldBeMasked(ringNum)) ? 0.75 : 0 } 
						fillColor= { (this.isSelectedRing(ringNum)) ? 'pink' : '#000' } 
						clickable={ false } 
						className={ 'donuthole' } 
						key={ 'donuthole' + ringNum } 
					/>
				);
			}
		}

		return layers;
	}

	parseAboutModalCopy () {
		let modalCopy = '';

		try {
			modalCopy = appConfig.aboutModalContent.join('\n');
		} catch (error) {
			console.warn('Error parsing modal copy: ', error);
			modalCopy = 'Error parsing modal copy.';
		}

		// React requires this format to render a string as HTML,
		// via dangerouslySetInnerHTML.
		return {
			__html: modalCopy
		};
	}

}

