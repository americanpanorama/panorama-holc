import * as React from 'react';
import { render } from 'react-dom';
import { Map, TileLayer, LayerGroup, GeoJson, Circle, MultiPolygon } from 'react-leaflet';
console.log(Object.getPrototypeOf(MultiPolygon.prototype));

import leafletsnogylop from 'leaflet.snogylop';
console.log(Object.getPrototypeOf(MultiPolygon.prototype));

import _ from 'lodash';

console.log(leafletsnogylop);

// import example module from @panorama
import { HashManager, ItemSelector, Legend } from '@panorama/toolkit';

// load from local copy of @panorama/toolkit repo.
// for development of panorama-template and @panorama/toolkit only.
// import { Legend, Punchcard } from '../../panorama/';

/*
 * Data flow via Flux:
 * https://facebook.github.io/flux/docsle/overview.html
 * 
 *                  ┌-----   actions  <-----┐
 *                  v                       |
 * actions --> dispatcher --> stores --> views
 */

// stores
import RasterStore from './stores/RasterStore';
import CityStore from './stores/CityStore';

// components (views)
// TODO: move this to another repo, probably @panorama/toolkit
import CartoDBTileLayer from './components/CartoDBTileLayer.jsx';
//import ItemSelector from './components/ItemSelector.jsx';
import HolcTileLayers from './components/HolcTileLayers.jsx';
import CityStats from './components/CityStats.jsx';
import AreaDescription from './components/AreaDescription.jsx';
import Donut from './components/Donut/Donut.jsx';

// utils
import { AppActions, AppActionTypes, ExampleActions } from './utils/AppActionCreator';

// config
import tileLayers from '../basemaps/tileLayers.json';
import cartodbConfig from '../basemaps/cartodb/config.json';
import cartodbLayers from '../basemaps/cartodb/basemaps.json';

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
		this.initialDataLoaded = this.initialDataLoaded.bind(this);
		this.storeChanged = this.storeChanged.bind(this);
		this.ringAreaSelected = this.ringAreaSelected.bind(this);
		this.ringAreaUnselected = this.ringAreaUnselected.bind(this);
		this.onCitySelected = this.onCitySelected.bind(this);
		this.onNeighborhoodClick = this.onNeighborhoodClick.bind(this);
		this.onMapMoved = this.onMapMoved.bind(this);

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

	componentWillUnmount () {

		// 

	}

	componentDidUpdate () {

		//

	}

	onWindowResize (event) {

		this.computeComponentDimensions();

	}


	getDefaultState () {

		let hashState = HashManager.getState();

		// this can be read from the url or defaults to Richmond
		return {
			selectedCity: (hashState.city) ? hashState.city : 125, // Richmond
			selectedNeighborhood: null,
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
		this.setState({selectedNeighborhood: id});
	}

	onCitySelected (value, index) {

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

	clearLayers() {
		if(typeof(this.refs.the_map) !== 'undefined') {
			let theMap = this.refs.the_map.leafletElement;
			theMap.eachLayer( function(layer) {
				theMap.removeLayer(layer);
			});
		};	
	}

	// a little different from storeChanged as the hash values are used if there are any
	initialDataLoaded () {
		console.log('initialDataLoaded called');
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
			rasters: RasterStore.getAllRasters(),
			ringStats: CityStore.getRingStats(),
			ringAreasGeometry: CityStore.getRingAreasGeometry(),
			ringAreaSelected: CityStore.getSelectedRingAreas(),
			areaDescriptions: CityStore.getAreaDescriptions(),
			outerRingRadius: CityStore.getOuterRingRadius(),
			loopLatLng: CityStore.getLoopLatLng(),
			map: {
				center: [ RasterStore.getSelectedCityMetadata('centerLat'), RasterStore.getSelectedCityMetadata('centerLng')],
				zoom: 12
			}
		});

		let newState = { city: this.state.selectedCity };
		newState[HashManager.MAP_STATE_KEY] = {
			zoom: this.state.map.zoom,
			center: this.state.map.center
		};

		console.log(newState);

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
			headerHeight = 60,
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

	getLoc () {

		// if it's specified in the url
		let hashState = HashManager.getState();
		if (hashState.loc && hashState.loc.center) {
			return [ hashState.loc.center[0], hashState.loc.center[1] ]
		}

		// otherwise use the selected city
		let rastersMetadata = RasterStore.getAllRasters();
		return (typeof rastersMetadata[this.state.selectedCity] != 'undefined') ? [ rastersMetadata[this.state.selectedCity].centerLat, rastersMetadata[this.state.selectedCity].centerLng ] : [30, 90];

	}

	getZoom() {
		// if it's specified in the url
		let hashState = HashManager.getState();
		console.log(hashState);
		if (hashState.loc && hashState.loc.zoom) {
			return hashState.zoom;
		}

		return 12;
	}

	getItemSelectorConfig() {
		return {
			title: 'Select a city:',
			items: RasterStore.getMapsList(),
			selectedItem: { id: this.state.selectedCity },
			//data: citiesList[1],
			onItemSelected: this.onCitySelected
		};
	}


	render () {

		console.log('render called');

		return (
			<div className='container full-height'>
				<div className='row full-height'>
					<div className='columns eight full-height'>
						<header className='row u-full-width'>
							<h1><span className='header-main'>Mapping Inequality</span><span className='header-sub'>Redlining in New Deal America</span></h1>
						</header>
						<div className='row template-tile leaflet-container' style={{height: this.state.dimensions.left.height + "px"}}>
							<Map ref={"the_map"} center={ this.state.map.center } zoom={ this.state.map.zoom }  onLeafletMoveend={ this.onMapMoved } >
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

							<LayerGroup key='shards'>
								{ this.renderGeoJsonLayers() }
							</LayerGroup>
							{ this.renderDonuts() }
							{ this.renderDonutholes() }
							{ this.renderNeighborhoodPolygons() }

							</Map>
						</div>
					</div>
					<div className='columns four full-height'>
						<div className='row top-row template-tile' style={ { height: this.state.dimensions.upperRight.height + "px" } }>
							<AreaDescription ref={'areadescription' + this.state.selectedNeighborhood } areaData={ (this.state.selectedNeighborhood != null) ? this.state.areaDescriptions[this.state.selectedNeighborhood] : {} } ></AreaDescription>
							<CityStats name={(typeof(RasterStore.getSelectedCityMetadata()) != 'undefined') ? RasterStore.getSelectedCityMetadata().name : ''} ringStats={ this.state.ringStats } areaSelected={ this.ringAreaSelected } areaUnselected={ this.ringAreaUnselected }/>
						</div>
						<div className='row bottom-row template-tile city-selector'>
							<ItemSelector { ...this.getItemSelectorConfig() } />
						</div>
					</div>
				</div>
			</div>
		);

	}

	renderNeighborhoodPolygons () {
		let layers = [],
			className;

		Object.keys(this.state.areaDescriptions).map((id, i) => {
			let opacity=0,
				strokeWidth=0;
			className = 'neighborhoodPolygon grade' + this.state.areaDescriptions[id].holc_grade;
			if (id == this.state.selectedNeighborhood) {
				layers.push(<GeoJson data={ this.state.areaDescriptions[id].area_geojson } className={ className + " deemphasize" } key={ 'neighborhoodPolygon-invert' + id} neighborhoodId={ id } clickable={ false } invert={ true } weight={ strokeWidth } />);
				strokeWidth = 2;
			} 
			layers.push(<GeoJson data={ this.state.areaDescriptions[id].area_geojson } className={ className } key={ 'neighborhoodPolygon' + id} onClick={ this.onNeighborhoodClick } neighborhoodId={ id } weight={ strokeWidth }/>);			
		});

		return layers; 
	}

	renderGeoJsonLayers () {
		let layers = [],
			className;

		this.state.ringAreasGeometry.map((item, i) => {
			let opacity = 0;
			className = 'ringArea ring' + item.ring_id + ' grade' + item.holc_grade;
			if (item.ring_id == this.state.ringAreaSelected.ringId && item.holc_grade == this.state.ringAreaSelected.grade) {
				className += ' selected';
				opacity = 1;
			}

			// hack to allow manipulating class on selection;
			// React does not update the className of the selected element below,
			// most likely because GeoJson passes className through to its <path>
			// element instead of the dummy <div> it creates (which React probably
			// uses for DOM diffing).
			//className += ' random' + String(Math.random());

			layers.push(<GeoJson data={ JSON.parse(item.the_geojson) } className={ className } opacity={ opacity } fillOpacity={ opacity } key={ 'ringStroke' + i }/>);
		});

		return layers;
	}

	renderDonuts () {
		let layers = [],
			className;

		if (this.state.outerRingRadius > 0) {
			for (let ringNum = 4; ringNum >= 1; ringNum--) {
				let outerRadius = this.state.outerRingRadius * 100;
				let innerRadius = (ringNum * 2 - 1) / 7 * this.state.outerRingRadius;
				let opacity = (ringNum == this.state.ringAreaSelected.ringId) ? 0.5 : 0;
				layers.push(<Donut center={ this.state.loopLatLng } outerRadius={ outerRadius } innerRadius={ innerRadius } fillOpacity={ opacity } className='donut' key={ 'donut' + String(ringNum) } ref={ "donut" + String(ringNum) }/>);
			}
		}

		return layers;
	}

	renderDonutholes() {
		let layers = [],
			className;

		if (this.state.outerRingRadius > 0) {
			for (let ringNum = 4; ringNum >= 2; ringNum--) {
				let radius = (ringNum * 2 - 3) / 7 * this.state.outerRingRadius;
				let opacity = (ringNum == this.state.ringAreaSelected.ringId) ? 0.5 : 0;
				layers.push(<Circle center={ this.state.loopLatLng } radius={ radius } fillOpacity={ opacity } className='donuthole' key={ 'donuthole' + String(ringNum) } />);
			}
		}

		return layers;

	}

}

