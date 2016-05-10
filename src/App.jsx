import * as React from 'react';
import update from 'react-addons-update';
import { render } from 'react-dom';
//import "babel-polyfill";
import Modal from 'react-modal';
import { Map, TileLayer, GeoJson, Circle, MultiPolygon } from 'react-leaflet';
import leafletsnogylop from 'leaflet.snogylop';

import { CartoDBTileLayer, HashManager, Legend, IntroManager, Navigation } from '@panorama/toolkit';

// stores
import RasterStore from './stores/RasterStore';
import CityStore from './stores/CityStore';

// components (views)
import CityStats from './components/CityStats.jsx';
import StateStats from './components/StateStats.jsx';
import AreaDescription from './components/AreaDescription.jsx';
import ADCat from './components/ADCat.jsx';
import Downloader from './components/Downloader.jsx';
import HolcItemSelector from './components/ItemSelector.jsx';
import Donut from './components/Donut/Donut.jsx';

// utils
import { AppActions, AppActionTypes } from './utils/AppActionCreator';

// config
import appConfig from '../data/appConfig.json';
import tileLayers from '../basemaps/tileLayers.json';
import cartodbConfig from '../basemaps/cartodb/config.json';
import cartodbLayers from '../basemaps/cartodb/basemaps.json';
import panoramaNavData from '../data/panorama_nav.json';

import stateAbbrs from '../data/state_abbr.json';
import formsMetadata from '../data/formsMetadata.json';

// main app container
export default class App extends React.Component {

	constructor (props) {
		super(props);

		this.state = this.getDefaultState();

		// bind handlers
		let handlers = ['onWindowResize','hashChanged','toggleAbout','toggleBurgessDiagram','initialDataLoaded','storeChanged','ringAreaSelected','ringAreaUnselected','onStateSelected','onCitySelected','onNeighborhoodClick','onSelectedNeighborhoodClick','triggerIntro','onIntroExit','onMapMoved','onPanoramaMenuClick','onDownloadClicked','updateSelectedState','onCategoryClick','neighborhoodHighlighted','neighborhoodsUnhighlighted'];
		handlers.map(handler => { this[handler] = this[handler].bind(this); });
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
		initialState.city = this.state.selectedCity.id;
		initialState[HashManager.MAP_STATE_KEY] = HashManager.getState(HashManager.MAP_STATE_KEY);
		HashManager.updateHash(initialState);
	}

	componentWillUnmount () { }

	componentDidUpdate () {
		this.updateCityPolygons();
		this.makeRingVisable();

		//this.refs.the_map.leafletElement.options.maxZoom = (this.state.selectedCity.id && RasterStore.hasLoaded()) ? RasterStore.getSelectedCityMetadata('maxZoom') : null;
	}

	getDefaultState () {
		let hashState = HashManager.getState();

		// this can be read from the url or defaults to Richmond
		return {
			rasters: {},
			selectedState: (hashState.state) ? hashState.state : null,
			selectedCity: {
				id: (hashState.city) ? hashState.city : (hashState.state) ? null : 168, // Richmond
				areaDescriptions: {},
				ADsByCat: {},
				selectedNeighborhood: (hashState.area) ? hashState.area : null,
				highlightedNeighborhood: null,
				selectedCategory: (hashState.category) ? hashState.category : null,
				selectedSubCat: (hashState.subcat) ? hashState.subcat : null,
				rings: {
					geometries: [],
					stats: {},
					outerRadius: null,
					selectedArea: {
						ringId: null,
						grade: ''
					},
				}
			},

			burgessDiagramVisible: false,
			intro: {
				open: false
			},
			downloadOpen: false,

			map: {
				zoom: 12,
				center: [30, 90]
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

	// a little different from storeChanged as the hash values are used if there are any
	initialDataLoaded () {
		let hashState = HashManager.getState();
		this.setState({
			selectedState: RasterStore.getSelectedCityMetadata('state'),
			selectedCity: {
				id: RasterStore.getSelectedCityMetadata('id'),
				selectedNeighborhood: (hashState && hashState.area) ? hashState.area : null,
				highlightedNeighborhood: null,
				selectedCategory: (hashState && hashState.category) ? hashState.category : null,
				selectedSubCat: (hashState && hashState.subcat) ? hashState.subcat : null,
				areaDescriptions: CityStore.getAreaDescriptions(),
				ADsByCat: CityStore.getADsByCat(),
				rings: {
					selectedArea: CityStore.getSelectedRingAreas(),
					geometries: CityStore.getRingAreasGeometry(),
					stats: CityStore.getRingStats(),
					center: CityStore.getLoopLatLng(),
					outerRadius: CityStore.getOuterRingRadius()
				},
			},
			rasters: RasterStore.getAllRasters(),
			map: {
				center: this.getLoc(),
				zoom: this.getZoom()
			}
		});
	}

	storeChanged () {
		this.setState({
			selectedState: RasterStore.getSelectedCityMetadata('state'),
			selectedCity: {
				id: RasterStore.getSelectedCityMetadata('id'),
				selectedNeighborhood: null,
				highlightedNeighborhood: null,
				selectedCategory: null,
				selectedSubCat: null,
				areaDescriptions: CityStore.getAreaDescriptions(),
				ADsByCat: CityStore.getADsByCat(),
				rings: {
					selectedArea:  CityStore.getSelectedRingAreas(),
					center: CityStore.getLoopLatLng(),
					geometries: CityStore.getRingAreasGeometry(),
					stats: CityStore.getRingStats(),
					outerRadius: CityStore.getOuterRingRadius()
				},
			},
			rasters: RasterStore.getAllRasters(),
			map: {
				center: [ RasterStore.getSelectedCityMetadata('centerLat'), RasterStore.getSelectedCityMetadata('centerLng')],
				zoom: this.refs.the_map.leafletElement.getBoundsZoom([ [ RasterStore.getSelectedCityMetadata('minLat'), RasterStore.getSelectedCityMetadata('minLng') ], [ RasterStore.getSelectedCityMetadata('maxLat'), RasterStore.getSelectedCityMetadata('maxLng') ] ])
			}
		});

		this.changeHash();
	}

	ringAreaSelected (ringNum, grade) {
		this.setState({selectedCity: update(this.state.selectedCity, {rings: {selectedArea: { ringId: {$set: ringNum}, grade: {$set: grade} }}})});
	}

	ringAreaUnselected () {
		this.setState({selectedCity: update(this.state.selectedCity, {rings: {selectedArea: { ringId: {$set: null}, grade: {$set: null} }}})});
	}

	neighborhoodSelected (id) {
		this.setState({selectedCity: update(this.state.selectedCity, {selectedNeighborhood: {$set: id}, selectedCategory: {$set: null}, highlightedNeighborhood: {$set: null}})}, this.changeHash);
	}

	neighborhoodHighlighted (event) {
		let id = event.target.id;
		this.setState({selectedCity: update(this.state.selectedCity, {highlightedNeighborhood: {$set: id}})});
	}

	neighborhoodsUnhighlighted (event) {
		this.setState({selectedCity: update(this.state.selectedCity, {highlightedNeighborhood: {$set: null}})});
	}

	categorySelected (id) {
		this.setState({
			selectedCity: update(this.state.selectedCity, {
				selectedCategory: {$set: id},
				selectedNeighborhood: {$set: null}
			})
		}, this.changeHash);
	}

	updateSelectedState () {
		console.log('executed');
		this.setState({
			selectedState: RasterStore.getSelectedCityMetadata('state'),
		});
	}

	onWindowResize (event) {
		this.computeComponentDimensions();
	}

	onCitySelected (value, index) {
		this.setState({
			selectedCity: update(this.state.selectedCity, {selectedNeighborhood: {$set: null}})
		});

		if (value && value.id) {
			AppActions.citySelected(value.id, this.updateSelectedState);
		}
	}

	onStateSelected (value, index) {
		// for click on state name in sidebar
		value = (value.target) ? value.target : value;
				
		this.setState({
			selectedState: value.id,
			selectedCity: {
				id: null,
				areaDescriptions: {},
				selectedNeighborhood: null,
				rings: {
					geometries: [],
					stats: {},
					outerRadius: null,
					selectedArea: {
						ringId: null,
						grade: ''
					},
				}
			},
			map: {
				zoom: this.refs.the_map.leafletElement.getBoundsZoom(RasterStore.getMapBoundsForState(value.id)),
				center: RasterStore.getCenterForState(value.id)
			}
		}, this.changeHash());
	}

	onNeighborhoodClick (event) {
		let neighborhoodId = (event.target.options) ? event.target.options.neighborhoodId : event.target.id;
		if (neighborhoodId !== this.state.selectedCity.selectedNeighborhood) {
			this.neighborhoodSelected(neighborhoodId);
		} else {
			this.neighborhoodSelected(null);
		}
	}

	onSelectedNeighborhoodClick () {
		this.neighborhoodSelected(null);
	}

	onCategoryClick (event) {
		this.categorySelected(event.target.id);
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
			isHighlighted,
			styling;

		let colors = {A: '#00ff00', 'B': 'blue', 'C': 'yellow', 'D': 'red'};

		if (this.state.selectedCity.areaDescriptions) {
			Object.keys(this.state.selectedCity.areaDescriptions).map((id, i) => {
				layerComponent = this.refs['city-grade-' + this.state.selectedCity.id + '-' + id];
				if (layerComponent) {
					isSelected = (id == this.state.selectedCity.selectedNeighborhood);
					isHighlighted = (id == this.state.selectedCity.highlightedNeighborhood);
					styling = {
						fillOpacity: (isSelected || isHighlighted) ? 0.5 : 0,
						weight: (isSelected || isHighlighted) ? 2 : 0
					}
					layerComponent.getLeafletElement().clearLayers();
					layerComponent.getLeafletElement().options.clickable = !isSelected;
					layerComponent.getLeafletElement().options.invert = isSelected || isHighlighted; // IMPORTANT: this has to happen before data is added.
					layerComponent.getLeafletElement().addData(this.state.selectedCity.areaDescriptions[id].area_geojson);
					layerComponent.getLeafletElement().setStyle(styling);
				}
			});
		}

		if (this.state.selectedCity.selectedNeighborhood && this.refs['unselectNeighborhood']) {
			layerComponent = this.refs['unselectNeighborhood'];
			layerComponent.getLeafletElement().clearLayers();
			layerComponent.getLeafletElement().addData(this.state.selectedCity.areaDescriptions[this.state.selectedCity.selectedNeighborhood].area_geojson);
		}

		if (this.state.selectedCity.rings.geometries) {
			this.state.selectedCity.rings.geometries.map((item, i) => {
				layerComponent = this.refs['ring-' + item.ring_id + '-grade-' + item.holc_grade + '-id-' + item.holc_id];
				if (layerComponent) {
					isSelected = (item.ring_id == this.state.selectedCity.rings.selectedArea.ringId && item.holc_grade == this.state.selectedCity.rings.selectedArea.grade);
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



	changeHash () {
		console.log(this.state);
		let newState = { 
			state: this.state.selectedState,
			city: this.state.selectedCity.id,
			area: this.state.selectedCity.selectedNeighborhood,
			category: this.state.selectedCity.selectedCategory
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
			bottomRowHeight = 300,
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
		let hashState = HashManager.getState();

		if (hashState.loc && hashState.loc.center) {
			return [ hashState.loc.center[0], hashState.loc.center[1] ]
		} else if (this.state.selectedCity.id) {
			return RasterStore.getCenter();
		} else if (this.state.selectedState) {
			return RasterStore.getCenterForState(this.state.selectedState);
		} else {
			return [30,-90];
		}
	}

	getZoom() {
		let hashState = HashManager.getState();
		if (hashState.loc && hashState.loc.zoom) {
			return hashState.loc.zoom;
		} else if (this.state.selectedCity.id) {
			return this.refs.the_map.leafletElement.getBoundsZoom(RasterStore.getMapBounds());
		} else if (this.state.selectedState) {
			return this.refs.the_map.leafletElement.getBoundsZoom(RasterStore.getMapBoundsForState(this.state.selectedState));
		} else {
			return 12;
		}
	}

	getItemSelectorConfig() {
		// get a list of the states in order to adjust color
		let stateList = RasterStore.getStatesList().map(item => item.id);
		let stateClasses = {};
		let selectedIndex = stateList.indexOf(this.state.selectedState);
		for (let i in stateList) {
			stateClasses[stateList[i]] = 'offset' + ((Math.abs(selectedIndex - i) < 5) ? Math.abs(selectedIndex - i) : 5);
		}

		return {
			title: 'Select a city:',
			items: RasterStore.getCitiesList().map(item => { 
				item.className = stateClasses[item.state]; 
				return item; 
			}),
			selectedItem: { id: (this.state.selectedCity.id) ? this.state.selectedCity.id : RasterStore.getFirstCityOfState(this.state.selectedState).id},
			onItemSelected: this.onCitySelected,
			stateItems: RasterStore.getStatesList().map((item, index) => {
				let selectedIndex, offset;
				RasterStore.getStatesList().forEach((item2, index2) => { 
					if (item2.id == this.state.selectedState) {
						selectedIndex = index2;
					}
				});
				offset = (Math.abs(selectedIndex - index) < 5) ? Math.abs(selectedIndex - index) : 5;
				item.className = 'offset' + offset;
				return item;
			}),
			selectedStateItem: { id: this.state.selectedState },
			onStateSelected: this.onStateSelected
		};
	}

	getNavData () {
		// remove the current map from the list
		return panoramaNavData.filter((item, i) => {
			return (item.url.indexOf('holc') === -1);
		});
	}

	isSelectedRing (ringNum) { return ringNum == this.state.selectedCity.rings.selectedArea.ringId; }

	donutShouldBeMasked (ringNum) { return this.state.selectedCity.rings.selectedArea.ringId > 0 && ringNum > this.state.selectedCity.rings.selectedArea.ringId; } 

	donutholeShouldBeMasked (ringNum) { return this.state.selectedCity.rings.selectedArea.ringId > 1 && ringNum == this.state.selectedCity.rings.selectedArea.ringId - 1; }

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
			mapConfig = this.state.map || this.state.mapConfig;

		return (
			<div className='container full-height'>
			<Navigation show_menu={ this.state.show_panorama_menu } on_hamburger_click={ this.onPanoramaMenuClick } nav_data={ this.getNavData() }  />
				<div className='row full-height'>
					<div className='columns eight full-height'>
						<header className='row u-full-width'>
							<h1><span className='header-main'>Mapping Inequality</span><span className='header-sub'>Redlining in New Deal America</span></h1>
							<h4 onClick={ this.toggleAbout }>Introduction</h4><h4 onClick={ this.toggleAbout }>Credits</h4>
							<hr className='style-eight'>
							</hr>					
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

								{ this.renderDonuts() }
								{ this.renderDonutholes() }
								{ this.renderRingShards() }
								{ this.renderNeighborhoodPolygons() } 
							</Map>
						</div>
					</div>
					<div className='columns four full-height'>
						<div className='row top-row template-tile' style={ { height: this.state.dimensions.upperRight.height + "px" } }>
							{ this.renderSidebar() }
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

		Object.keys(this.state.selectedCity.areaDescriptions).map((id, i) => {
			layers.push(<GeoJson 
				data={ this.state.selectedCity.areaDescriptions[id].area_geojson } 
				className={ 'neighborhoodPolygon grade' + this.state.selectedCity.areaDescriptions[id].holc_grade } 
				key={ 'neighborhoodPolygon' + id } 
				ref={ 'city-grade-' + this.state.selectedCity.id + '-' + id } 
				onClick={ this.onNeighborhoodClick } 
				neighborhoodId={ id } 
				fillOpacity={0}
				weight={ 0 }
			/>);
		});

		if (layers.length > 0 && this.state.selectedCity.selectedNeighborhood) {
			layers.push(<GeoJson
				data={ this.state.selectedCity.areaDescriptions[this.state.selectedCity.selectedNeighborhood].area_geojson }
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

		this.state.selectedCity.rings.geometries.map((item, i) => {
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

		if (this.state.selectedCity.rings.outerRadius > 0) {
			for (let ringNum = 5; ringNum >= 2; ringNum--) {
				layers.push(
					<Donut 
						center={ this.state.selectedCity.rings.center } 
						innerRadius={ (ringNum * 2 - 3) / 7 * this.state.selectedCity.rings.outerRadius }
						outerRadius={ (ringNum == 5) ? this.state.selectedCity.rings.outerRadius * 100 : (ringNum * 2 - 1) / 7 * this.state.selectedCity.rings.outerRadius}
						clickable={ false } 
						fillOpacity={ (this.isSelectedRing(ringNum)) ? 0.5 : this.donutShouldBeMasked(ringNum) ? 0.75 : 0 } 
						fillColor= { (this.isSelectedRing(ringNum)) ? 'white' : '#000' } 
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

		if (this.state.selectedCity.rings.outerRadius > 0) {
			for (let ringNum = 3; ringNum >= 1; ringNum--) {
				layers.push(
					<Circle 
						center={ this.state.selectedCity.rings.center } 
						radius={ (ringNum * 2 - 1) / 7 * this.state.selectedCity.rings.outerRadius } 
						fillOpacity={ (this.isSelectedRing(ringNum)) ? 0.5 : (this.donutholeShouldBeMasked(ringNum)) ? 0.75 : 0 } 
						fillColor= { (this.isSelectedRing(ringNum)) ? 'white' : '#000' } 
						clickable={ false } 
						className={ 'donuthole' } 
						key={ 'donuthole' + ringNum } 
					/>
				);
			}
		}

		return layers;
	}

	renderSidebar() {
		let title, content, theClass;

		if (this.state.downloadOpen) {
			title = <h2>{ (typeof(RasterStore.getSelectedCityMetadata()) != 'undefined') ? RasterStore.getSelectedCityMetadata().name : '' }<div className='downloadicon' href="#" onClick={ this.onDownloadClicked }></div></h2>;
			content = <Downloader mapurl={ RasterStore.getMapUrl() } name={ RasterStore.getSelectedCityMetadata().name } />;
		} else if (this.state.selectedCity.selectedNeighborhood) {
			theClass = 'area';
			title = <h2>
						<span>{ RasterStore.getSelectedCityMetadata().name }</span>, <span onClick={ this.onStateSelected } id={ this.state.selectedState }>{ this.state.selectedState }</span>
						<div className='downloadicon' href="#" onClick={ this.onDownloadClicked }></div>
					</h2>;
			content = <AreaDescription areaId={ this.state.selectedCity.selectedNeighborhood } areaData={ this.state.selectedCity.areaDescriptions[this.state.selectedCity.selectedNeighborhood] } formId={ CityStore.getFormId() } onCategoryClick={ this.onCategoryClick } onNeighborhoodClick={ this.onNeighborhoodClick } ref={'areadescription' + this.state.selectedCity.selectedNeighborhood } />;
		} else if (this.state.selectedCity.selectedCategory && CityStore.getADsByCat(...this.state.selectedCity.selectedCategory.split('-'))) {
			let [catNum, catLetter] = this.state.selectedCity.selectedCategory.split('-');
			theClass = 'category';
			title = <h2>
						<span>{ RasterStore.getSelectedCityMetadata().name }</span>, <span onClick={ this.onStateSelected } id={ this.state.selectedState }>{ this.state.selectedState }</span>
						<div className='downloadicon' href="#" onClick={ this.onDownloadClicked }></div>
					</h2>;
			content = <ADCat catNum={ catNum } catLetter = { catLetter } onNeighborhoodClick={ this.onNeighborhoodClick } onCategoryClick={ this.onCategoryClick } onNeighborhoodHover={ this.neighborhoodHighlighted } onNeighborhoodOut={ this.neighborhoodsUnhighlighted } />;
		} else if (this.state.selectedCity.id) {
			theClass = 'city';
			title = <h2>
								<span>{ RasterStore.getSelectedCityMetadata().name }</span>, <span onClick={ this.onStateSelected } id={ this.state.selectedState }>{ this.state.selectedState }</span>
								<div className='downloadicon' href="#" onClick={ this.onDownloadClicked }></div>
							</h2>;
			content = <CityStats cityData={ CityStore.getCityData() } area={ CityStore.getArea() } ringStats={ this.state.selectedCity.rings.stats } areaSelected={ this.ringAreaSelected } areaUnselected={ this.ringAreaUnselected } triggerIntro={ this.triggerIntro } burgessDiagramVisible={ this.state.burgessDiagramVisible } toggleBurgessDiagram={ this.toggleBurgessDiagram } />;
		} else if (this.state.selectedState) {
			theClass = 'state';
			title = <h2>{ stateAbbrs[this.state.selectedState] }</h2>;
			content = <StateStats stateName={this.state.selectedState} />;
		}


		return (
			<div className={ 'punchcard-container ' + theClass } key={ theClass }>
				{ title }
				{ content }
			</div>
		)
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

