import * as React from 'react';
//import "babel-polyfill";

// stores
import AreaDescriptionsStore from './stores/AreaDescriptionsStore';
import CityStore from './stores/CityStore';
import DimensionsStore from './stores/DimensionsStore';
import MapStateStore from './stores/MapStateStore';
import RasterStore from './stores/RasterStore';
import UserLocationStore from './stores/UserLocationStore';
import TextsStore from './stores/TextsStore';

// components (views)
import ADCat from './components/ADCat.jsx';
import AreaDescription from './components/AreaDescription.jsx';
import { CartoDBTileLayer, HashManager, Legend, Navigation } from '@panorama/toolkit';
import CitySnippet from './components/CitySnippet.jsx';
import CityStats from './components/CityStats.jsx';
import Downloader from './components/Downloader.jsx';
import { icon } from 'leaflet';
import { Map, TileLayer, LayerGroup, setIconDefaultImagePath } from 'react-leaflet';
import Modal from 'react-modal';
import Slider from 'rc-slider';
import StateStats from './components/StateStats.jsx';
import { Typeahead } from 'react-typeahead';
import TypeAheadCitySnippet from './components/TypeAheadCitySnippet.jsx';
import HOLCMap from './components/HOLCMap.jsx';
import SidebarMap from './components/SidebarMap.jsx';

// utils
import { AppActions, AppActionTypes } from './utils/AppActionCreator';

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
		const handlers = ['onWindowResize','onModalClick','toggleBurgessDiagram','storeChanged','onBurgessChartOff','onBurgessChartHover','onStateSelected','onCitySelected','onMapMoved','onPanoramaMenuClick','onDownloadClicked','onCategoryClick','neighborhoodHighlighted','neighborhoodsUnhighlighted','onSliderChange','onUserCityResponse','onNeighborhoodPolygonClick','onAreaChartHover','onAreaChartOff','onCityMarkerSelected','onGradeHover','onGradeUnhover','onHOLCIDClick','onNeighborhoodClose','onCategoryClose','onAdImageClicked','changeHash'];
		handlers.map(handler => { this[handler] = this[handler].bind(this); });
	}

	/* Lifecycle methods */

	componentWillMount () {
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

		window.addEventListener('resize', this.onWindowResize);
		AreaDescriptionsStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		CityStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		DimensionsStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		MapStateStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		RasterStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		UserLocationStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		TextsStore.addListener(AppActionTypes.storeChanged, this.storeChanged);

		// you have to wait until there's a map to query to get the visible maps
		const waitingId = setInterval(() => {
			if (RasterStore.hasLoaded() && AreaDescriptionsStore.hasLoaded()) {
				clearInterval(waitingId);

				// emit mapped moved event to initialize map state
				AppActions.mapInitialized(this.getLeafletElementForMap());
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
			adImageOpen: (hashState.adimage),
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
		AppActions.mapMoved(this.getLeafletElementForMap());
	}

	onCitySelected (event) {
		this.closeADImage();
		AppActions.citySelected(event.target.id, true);
	}

	onCityMarkerSelected (event) {
		this.closeADImage();
		AppActions.citySelected(event.target.options.id, true);
	}

	onNeighborhoodPolygonClick (event) {
		let neighborhoodId = event.target.options.neighborhoodId,
			adId = parseInt(event.target.options.adId);

		// clicking on a selected neighborhood deselects it and closeds the adImage if it's open
		if (neighborhoodId == this.state.selectedNeighborhood && adId == this.state.selectedCity) {
			neighborhoodId = null;
			this.closeADImage();
		} 

		AppActions.neighborhoodSelected(neighborhoodId, adId);
	}

	onNeighborhoodClose() {
		this.closeADImage();
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
		this.closeADImage();
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
		AppActions.windowResized();
	}

	onStateSelected (value, index) {
		// for click on state name in sidebar
		value = (value.target) ? value.target : value;
				
		this.setState({
			selectedCity: null,
			selectedNeighborhood: null,
			map: {
				zoom: this.getLeafletElementForMap().getBoundsZoom(RasterStore.getMapBoundsForState(value.id)),
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
		AppActions.ADImageOpened(this.state.selectedNeighborhood, this.state.selectedCity);
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

	closeADImage() {
		this.setState({
			adImageOpen: false
		});
	}

	getLeafletElementForMap() {
		return (this.refs.holc_map) ? this.refs.holc_map.refs.the_map.leafletElement : this.refs.sidebar_map.refs.holc_map.refs.the_map.leafletElement;
	}

	getLeafletElementForAD() {
		return (this.refs.the_ad_tiles) ? this.refs.the_ad_tiles.leafletElement : null;
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
			},
			adimage: (this.state.adImageOpen) ? this.formatADHashState() : null,
		});
	}

	formatADHashState () {
		if (!this.state.adImageOpen) {
			return null;
		}

		const adLE = this.getLeafletElementForAD(),
			zoom = adLE.getZoom(),
			center = adLE.getCenter(),
			x = Math.round(center.lng),
			y = Math.round(center.lat);

		return zoom + '/' + y + '/' + x;
	}

	getADZoom() {
		const hashState = HashManager.getState();
		return (hashState.adimage) ? parseInt(hashState.adimage.split('/')[0]) : 3;
	}

	getADX() {
		const hashState = HashManager.getState();
		return (hashState.adimage) ? parseInt(hashState.adimage.split('/')[2]) : -125;
	}

	getADY() {
		const hashState = HashManager.getState();
		return (hashState.adimage) ? parseInt(hashState.adimage.split('/')[1]) : 75;
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
			visibleStates = MapStateStore.getVisibleHOLCMapsByState(),
			visibleStateNames = (visibleStates) ? 
				Object.keys(visibleStates).sort((a,b) => {
					console.log(stateAbbrs[a], stateAbbrs[b], stateAbbrs[a] < stateAbbrs[b]); 
					return stateAbbrs[a] < stateAbbrs[b]; 
				}) : [];

		console.log(visibleStateNames);

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
						<div 
							className='row template-tile leaflet-container main-pane' 
							style={ DimensionsStore.getMainPaneStyle() }
						>

							{ (!this.state.adImageOpen) ?
								<HOLCMap
									ref='holc_map'
									state={ this.state }
									onMapMoved={ this.onMapMoved }
									onNeighborhoodPolygonClick={ this.onNeighborhoodPolygonClick }
									onCityMarkerSelected= { this.onCityMarkerSelected }
								/> :
								<Map 
									ref='the_ad_tiles' 
									center={ [this.getADY(),this.getADX()] } 
									zoom={ this.getADZoom() }  
									className='the_ad'
									style={ DimensionsStore.getADViewerStyle() }
									onMoveend={ this.changeHash }
								>

									{ AreaDescriptionsStore.hasLoaded() ? 
										<TileLayer
											key='AD'
											url={ AreaDescriptionsStore.getAdTileUrl(this.state.selectedCity, this.state.selectedNeighborhood) }
											zIndex={ 1000 }
										/>:
										null
									}

									<Legend 
										items={ [ 'Close' ] }
										className='adClose' 
										onItemSelected={ this.onAdImageClicked } 
									/>

									
								</Map> 
							}
							
							

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

						</div>
					</div>
					{ (aboveThreshold) ?
						<div className='opacitySlider'>
							<Slider 
								vertical={ true }
								defaultValue={ this.state.raster.opacity * 100 }
								onAfterChange={ this.onSliderChange }
							/>
						</div> :
						''
					}

					<div className='columns four full-height'>

						<div 
							className='row template-tile city-selector' 
							style={ DimensionsStore.getSearchStyle() }
						>
							<Typeahead
								options={ AreaDescriptionsStore.getADsList() }
								placeholder={ 'Search by city or state' }
								filterOption={ 'searchName' }
								displayOption={(city, i) => city.ad_id }
								onOptionSelected={ this.onCitySelected }
								customListComponent={ TypeAheadCitySnippet }
								maxVisible={ 8 }
							/>
						</div>

						<div 
							className='row full-height template-tile dataViewer' 
							style={ DimensionsStore.getSidebarHeightStyle() }
						>

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
							

							{ (this.state.selectedNeighborhood && !this.state.adImageOpen) ? 
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
									previousStyle={ DimensionsStore.getADNavPreviousStyle() }
									nextStyle={ DimensionsStore.getADNavNextStyle() }
								/> : 
								''
							}

							{ (this.state.selectedNeighborhood && this.state.adImageOpen) ? 
								<SidebarMap
									ref='sidebar_map'
									state={ this.state }
									onMapMoved={ this.onMapMoved }
									onNeighborhoodPolygonClick={ this.onNeighborhoodPolygonClick }
									onCityMarkerSelected= { this.onCityMarkerSelected }
									areaId={ this.state.selectedNeighborhood } 
									previousAreaId={ AreaDescriptionsStore.getPreviousHOLCId(this.state.selectedCity, this.state.selectedNeighborhood) }
									nextAreaId={ AreaDescriptionsStore.getNextHOLCId(this.state.selectedCity, this.state.selectedNeighborhood) }
									neighborhoodNames={ neighborhoodNames }
									onHOLCIDClick={ this.onHOLCIDClick } 
									onClose={ this.onNeighborhoodClose }
									previousStyle={ DimensionsStore.getADNavPreviousStyle() }
									nextStyle={ DimensionsStore.getADNavNextStyle() }
									mapStyle={ DimensionsStore.getSidebarMapStyle() }
									
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
									previousStyle={ DimensionsStore.getADNavPreviousStyle() }
									nextStyle={ DimensionsStore.getADNavNextStyle() }
									onClose={ this.onCategoryClose }
								/> :
								''
							}

							{ (!this.state.selectedCity && !this.state.selectedNeighborhood && !this.state.selectedCategory && visibleStates) ?
								Object.keys(visibleStates).sort((a,b) => a > b).map((theState) => {
									return <StateStats 
										stateName={ stateAbbrs[theState] } 
										cities={ visibleStates[theState] } 
										onCityClick={ this.onCitySelected }
										key={ theState }
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