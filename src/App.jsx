// import node modules
import * as React from 'react';
import { render } from 'react-dom';
import { Map, TileLayer, LayerGroup, GeoJson, Circle, MultiPolygon } from 'react-leaflet';
import _ from 'lodash';

// import example module from @panorama
import { Legend, Punchcard } from '@panorama/toolkit';

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
//import RasterComponent from './components/RasterComponent.jsx';
//import ExampleComponent from './components/ExampleComponent.jsx';

// TODO: move this to another repo, probably @panorama/toolkit
import CartoDBTileLayer from './components/CartoDBTileLayer.jsx';
import ItemSelector from './components/ItemSelector.jsx';
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
		this.storeChanged = this.storeChanged.bind(this);
		this.ringAreaSelected = this.ringAreaSelected.bind(this);
		this.ringAreaUnselected = this.ringAreaUnselected.bind(this);
	}

	componentWillMount () {

		this.computeComponentDimensions();
		this 

		AppActions.loadInitialData(this.state);

	}

	componentDidMount () {

		window.addEventListener('resize', this.onWindowResize);		
		RasterStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		CityStore.addListener(AppActionTypes.storeChanged, this.storeChanged);

		//console.log(`Welcome to your Flux tour. Watch the data flow...`);
		//console.log(`[1a] App requests initial data in App.componentDidMount().`);

		//AppActions.loadInitialData(this.state);
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

		return {
			selectedCity: 168, // Richmond
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

	clearLayers() {
		if(typeof(this.refs.the_map) !== 'undefined') {
			let theMap = this.refs.the_map.leafletElement;
			theMap.eachLayer( function(layer) {
				theMap.removeLayer(layer);
			});
		};	
	}


	storeChanged () {

		this.setState({
			rasters: RasterStore.getAllRasters(),
			ringStats: CityStore.getRingStats(),
			ringAreasGeometry: CityStore.getRingAreasGeometry(),
			ringAreaSelected: CityStore.getSelectedRingAreas(),
			areaDescriptions: CityStore.getAreaDescriptions(),
			outerRingRadius: CityStore.getOuterRingRadius(),
			loopLatLng: CityStore.getLoopLatLng()
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


	render () {

		console.log('render called');
		if (typeof(this.state.areaDescriptions.B4) !== 'undefined') {
			console.log(this.state.areaDescriptions.B4);
		}

		// restructure rastersMetadata to a simple list for rendering
		// move in store or store changed
		let rastersMetadata = RasterStore.getAllRasters();
		let selectedCity = RasterStore.getSelectedCity();
		
		let citiesList = [];
		for (let cityId in rastersMetadata) {
			citiesList.push({
				state: rastersMetadata[cityId].state,
				name: rastersMetadata[cityId].name,
				year: rastersMetadata[cityId].year,
				display: rastersMetadata[cityId].name + ", " + rastersMetadata[cityId].state,
				cityId: rastersMetadata[cityId].cityId
			});
		};

		let mapsList = RasterStore.getMapsList();


		// TODO: these values need to go elsewhere, probably in a componentized hash parser/manager
		let loc = [(typeof(rastersMetadata[selectedCity]) != 'undefined') ? rastersMetadata[selectedCity].centerLat : 30, (typeof(rastersMetadata[selectedCity]) != 'undefined') ? rastersMetadata[selectedCity].centerLng : -90 ],
			zoom = 12;

		if(typeof(this.refs.the_map) !== 'undefined') {
			this.refs.the_map.leafletElement.setView(loc);
			this.refs.the_map.leafletElement.fitBounds([[rastersMetadata[selectedCity].minLat, rastersMetadata[selectedCity].minLng], [rastersMetadata[selectedCity].maxLat, rastersMetadata[selectedCity].maxLng]]);
			//this.clearLayers();
		};



		// sort cities by city then state
		citiesList.sort(function(a,b) {return (a.city > b.city) ? 1 : ((b.city > a.city) ? -1 : 0);} );
		citiesList.sort(function(a,b) {return (a.state > b.state) ? 1 : ((b.state > a.state) ? -1 : 0);} );

		return (
			<div className='container full-height'>
				<div className='row full-height'>
					<div className='columns eight full-height'>
						<header className='row u-full-width'>
							<h1><span className='header-main'>Mapping Inequality</span><span className='header-sub'>Redlining in New Deal America</span></h1>
						</header>
						<div className='row template-tile leaflet-container' style={{height: this.state.dimensions.left.height + "px"}}>
							<Map ref={"the_map"} center={loc} zoom={zoom}>
							{ tileLayers.layers.map((item, i) => {
								return (
									<TileLayer
										key={ 'basetiles' + i }
										url={ item.url }
									/>
								);
							}) }
							{ mapsList.map((item, i) => {
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

							</Map>
						</div>
					</div>
					<div className='columns four full-height'>
						<div className='row top-row template-tile' style={ { height: this.state.dimensions.upperRight.height + "px" } }>
							<AreaDescription areaData={ (typeof(this.state.areaDescriptions.B4) !== 'undefined') ? this.state.areaDescriptions.B4 : {} } ></AreaDescription>
							<CityStats name={(typeof(RasterStore.getSelectedCityMetadata()) != 'undefined') ? RasterStore.getSelectedCityMetadata().name : ''} ringStats={ this.state.ringStats } areaSelected={ this.ringAreaSelected } areaUnselected={ this.ringAreaUnselected }/>
						</div>
						<div className='row bottom-row template-tile city-selector'>
							<ItemSelector items={ citiesList }  />
						</div>
					</div>
				</div>
			</div>
		);

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

		/* if (this.state.outerRingRadius > 0) {
			for (let ringNum = 4; ringNum >= 1; ringNum--) {
				let multiplier = (ringNum * 2 - 1) / 7 * this.state.outerRingRadius;
				layers.push(<Circle center={ this.state.loopLatLng } radius={ multiplier } className='ring' ref={ "ring" + String(ringNum) }/>);
			}
		} */

		console.log(layers);

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

