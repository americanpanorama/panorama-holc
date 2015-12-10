// import node modules
import * as React from 'react';
import Modal from 'react-modal';
import { Map, TileLayer, GeoJson } from 'react-leaflet';

// import example module from @panorama
import { Legend, Punchcard } from '@panorama/toolkit';

/*
 * Data flow via Flux:
 * https://facebook.github.io/flux/docs/overview.html
 * 
 *                  ┌-----   actions   <-----┐
 *                  v                        |
 * actions --> dispatcher --> stores --> root view
 */

// stores
import ExampleStore from './stores/ExampleStore';

// local (not installed via npm) components (views)
import ExampleComponent from './components/ExampleComponent.jsx';

// TODO: move this to another repo, probably @panorama/toolkit
import CartoDBTileLayer from './components/CartoDBTileLayer.jsx';

// utils
// TODO: refactor to use same structure as PanoramaDispatcher;
// Having `flux` as a dependency, and two different files, is overkill.
import AppDispatcher from './utils/AppDispatcher';
import { AppActionTypes, ExampleActions } from './utils/AppActionCreator';

// config
import tileLayers from '../basemaps/tileLayers.json';
import cartodbConfig from '../basemaps/cartodb/config.json';
import cartodbLayers from '../basemaps/cartodb/basemaps.json';


// main app container
class App extends React.Component {

	constructor (props) {

		super(props);

		// set up initial state in constructor
		// (instead of ES5-style getInitialState)
		this.state = this.getDefaultState();

		// bind handlers to this component instance,
		// since React no longer does this automatically when using ES6
		this.storeChanged = this.storeChanged.bind(this);
		this.onWindowResize = this.onWindowResize.bind(this);
		this.toggleAbout = this.toggleAbout.bind(this);
		this.onLegendItemSelected = this.onLegendItemSelected.bind(this);

	}



	// ============================================================ //
	// React Lifecycle
	// ============================================================ //

	getDefaultState () {

		return {
			dimensions: {
				upperLeft: {
					width: 0,
					height: 0
				},
				upperRight: {
					width: 0,
					height: 0
				}
			},
			selectedItem: 0
		};

	}

	componentWillMount () {

		this.computeComponentDimensions();

	}

	componentDidMount () {

		window.addEventListener('resize', this.onWindowResize);

		console.log(`Welcome to your Flux tour. Watch the data flow...`);
		console.log(`[1a] App listens for change events dispatched from ExampleStore.`);
		ExampleStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		
		console.log(`[1b] App requests initial data in App.componentDidMount().`);
		ExampleActions.getInitialData(this.state);

	}

	componentWillUnmount () {

		ExampleStore.removeListener(AppActionTypes.storeChanged, this.storeChanged);

	}

	componentDidUpdate () {

		//

	}



	// ============================================================ //
	// Handlers
	// ============================================================ //

	storeChanged () {

		console.log(`[4] The data requested on app init land in the root view (App.storeChanged), from where they will flow down the component tree. A setState() call updates the data and triggers a render().`);

		let data = ExampleStore.getData();

		// setState with the updated data, which causes a re-render()
		this.setState({
			exampleComponent: {
				title: data.exampleTitle,
				loading: false
			},
			legend: data.legend,
			punchcard: data.punchcard
		});

	}

	onLegendItemSelected (value, index) {

		this.setState({
			selectedItem: index,
			legend: {
				...this.state.legend,	// merge existing state into new state
				selectedItem: value
			},
		});

	}

	onWindowResize (event) {

		this.computeComponentDimensions();

	}

	toggleAbout () {

		this.setState({
			aboutModalOpen: !this.state.aboutModalOpen
		});

	}



	// ============================================================ //
	// Helpers
	// ============================================================ //

	computeComponentDimensions () {

		// based off of sizes stored within _variables.scss --
		// if you change them there, change them here.
		let containerPadding = 20,
			headerHeight = 90,
			breakpointWidthWide = 1280,
			bottomRowHeightShort = 230,
			bottomRowHeightTall = 310,
			bottomRowHeight,
			dimensions = {};

		// Calculate bottom row height as set by media breakpoints
		let bottomRowEl = document.querySelector('.bottom-row'),
			bottomRowHeightStyle;

		if (bottomRowEl) {
			bottomRowHeightStyle = window.getComputedStyle(bottomRowEl);
			bottomRowHeight = bottomRowEl.offsetHeight + parseFloat(bottomRowHeightStyle.marginTop.replace('px', '')) + parseFloat(bottomRowHeightStyle.marginBottom.replace('px', ''));
		} else {
			bottomRowHeight = window.innerWidth < breakpointWidthWide ? bottomRowHeightShort : bottomRowHeightTall;
		}

		dimensions.upperRight = {
			height: window.innerHeight - bottomRowHeight - 3 * containerPadding
		};
		dimensions.upperLeft = {
			height: dimensions.upperRight.height - headerHeight
		};
		dimensions.lowerLeft = {
			height: bottomRowHeight - 2 * containerPadding
		};
		dimensions.lowerRight = {
			height: dimensions.lowerLeft.height
		};

		this.setState({ dimensions: dimensions });

	}



	// ============================================================ //
	// Render functions
	// ============================================================ //

	renderTileLayers () {

		let layers = [];

		if (cartodbLayers.layergroup && cartodbLayers.layergroup.layers) {
			layers = layers.concat(cartodbLayers.layergroup.layers.map((item, i) => {
				return (
					<CartoDBTileLayer
						key={ 'cartodb-tile-layer-' + i }
						userId={ cartodbConfig.userId }
						sql={ item.options.sql }
						cartocss={ item.options.cartocss }
					/>
				);
			}));
		}

		if (tileLayers.layers) {
			layers = layers.concat(tileLayers.layers.map((item, i) => {
				return (
					<TileLayer
						key={ 'tile-layer-' + i }
						url={ item.url }
					/>
				);
			}));
		}

		return layers;
	}

	render () {

		// TODO: these values need to go elsewhere, probably in a componentized hash parser/manager
		let loc = [-5.200, 0.330],
			zoom = 5,

			modalStyle = {
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
			};

		return (
			<div className='container full-height'>

				<div className='row full-height'>
					<div className='columns eight left-column full-height'>
						<header className='row u-full-width'>
							<h1><span className='header-main'>PANORAMA TEMPLATE</span></h1>
							<h4 onClick={ this.toggleAbout }>ABOUT THIS MAP</h4>
						</header>
						<div className='row top-row template-tile' style={ { height: this.state.dimensions.upperLeft.height + "px" } }>
							<Map center={ loc } zoom={ zoom }>
								{ this.renderTileLayers() }
							</Map>
						</div>
						<div className='row bottom-row template-tile'>
							<h2>Local component:</h2>
							<ExampleComponent { ...this.state.exampleComponent } />
						</div>
					</div>
					<div className='columns four right-column full-height'>
						<div className='row top-row template-tile' style={ { height: this.state.dimensions.upperRight.height + "px" } }>
							{ this.state.punchcard ? <Punchcard { ...this.state.punchcard[this.state.selectedItem] } /> : '' }
						</div>
						<div className='row bottom-row template-tile'>
							<h2>Imported component:</h2>
							{ this.state.legend ? <Legend { ...this.state.legend } onItemSelected={ this.onLegendItemSelected }/> : '' }
						</div>
					</div>
				</div>

				<Modal isOpen={ this.state.aboutModalOpen } onRequestClose={ this.toggleAbout } style={ modalStyle }>
					<button className="close" onClick={ this.toggleAbout }><span>×</span></button>
					<h3>About this Map</h3>
					<p>The subtitle is borrowed from historian Robin D.G. Kelley, who begins one of his essays with the question "What is the United States, if not a nation of overlapping diasporas?" At all points in its history, a significant proportion of the population of the United States had been born in other countries and regions. This being the case, American history can never be understood by just looking within its borders. The culture and politics of the US have always been profoundly shaped by the material and emotional ties many of its residents have had to the places where they were born. This map will allow you to begin to explore those connections at the basic level of demographic statistics. </p>
					<h3>Sources</h3>
					<p>All of the data comes from <a href='https://www.nhgis.org/'>Minnesota Population Center, National Historical Geographic Information System: Version 2.0 (Minneapolis, MN: University of Minnesota, 2011)</a>. County boundaries are from the Newberry Library's <a href='http://publications.newberry.org/ahcbp/'>Atlas of Historical County Boundaries</a>.</p>
					<h3>Suggested Reading</h3>
					<p>Much of the best scholarship on the foreign born concentrates on particular groups at specific moments in time, works like George J. Sanchez's <cite>Becoming Mexican American: Ethnicity, Culture and Identity in Chicano Los Angeles, 1900-1945</cite>. Some thoughtful works that deal with the foreign-born population and issues of migration more generally are:</p>
					<ul>
						<li>Roger Daniels, <cite>Coming to America: A History of Immigration and Ethnicity in American Life</cite> (New York: Harper Collins, 1990).</li>
						<li>Thomas Bender, ed. <cite>Rethinking American History in a Global Age</cite> (Berkeley, CA: University of California Press, 2002). [Kelley's essay "How the West Was One: The African Diaspora and the Remapping of U.S. History" is in this collection.]</li>
						<li>Henry Yu, "Los Angeles and American Studies in a Pacific World of Migrations," <cite>American Quarterly</cite> 56 (September 2004) 531-543.</li>
						</ul>
					<h3>Acknowledgements</h3>
					<p>This map is authored by the staff of the Digital Scholarship Lab: Robert K. Nelson, Scott Nesbit, Edward L. Ayers, Justin Madron, and Nathaniel Ayers. Kim D'agostini and Erica Havens geolocated country locations.</p>
					<p>The developers, designers, and staff at Stamen Design have been exceptional partners on this project. Our thanks to Kai Chang, Jon Christensen, Seth Fitzsimmons, Eric Gelinas, Sean Connelley, Nicolette Hayes, Alan McConchie, Michael Neuman, Dan Rademacher, and Eric Rodenbeck.</p>
				</Modal>

			</div>
		);

	}

}

export default App;
