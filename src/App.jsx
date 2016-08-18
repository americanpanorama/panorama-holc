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
		const handlers = ['onWindowResize','onModalClick','toggleBurgessDiagram','storeChanged','onBurgessChartOff','onBurgessChartHover','onStateSelected','onCitySelected','onMapMoved','onPanoramaMenuClick','onDownloadClicked','onCategoryClick','neighborhoodHighlighted','neighborhoodsUnhighlighted','onSliderChange','onUserCityResponse','onNeighborhoodPolygonClick','onAreaChartHover','onAreaChartOff','onCityMarkerSelected','onGradeHover','onGradeUnhover','onHOLCIDClick','onNeighborhoodClose','onCategoryClose','onAdImageClicked','changeHash','downloadGeojson','onCountrySelected'];
		handlers.map(handler => { this[handler] = this[handler].bind(this); });
	}

	/* Lifecycle methods */

	componentWillMount () {
		AppActions.loadInitialData(this.state, HashManager.getState());
		

		//try to retrieve the users location
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

	componentDidUpdate () {
		this.changeHash();
	}

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
			text: (hashState.text) ? hashState.text : null,
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
			},
			adImageOpen: ((MapStateStore.isAboveZoomThreshold() == false || !CityStore.getSelectedHolcId() || !CityStore.getId()) && CityStore.hasLoaded() && MapStateStore.hasLoaded()) ? false : this.state.adImageOpen,
			text: TextsStore.getSubject()
		}); 
	}

	/* action handler functions */

	onAdImageClicked () {
		AppActions.ADImageOpened(this.state.selectedNeighborhood, this.state.selectedCity);
		this.setState({
			adImageOpen: !this.state.adImageOpen
		});
	}

	onAreaChartHover (grade) { AppActions.gradeSelected(grade); }

	onAreaChartOff () { AppActions.gradeSelected(null); }

	onBurgessChartHover (ringId, grade) { AppActions.ringGradeSelected({ringId: ringId, grade: grade}); }

	onBurgessChartOff () { AppActions.ringGradeSelected({ringId: -1, grade: null}); }

	onCategoryClick (event) {
		this.closeADImage();
		AppActions.ADCategorySelected(event.target.id);
	}

	onCategoryClose (event) {AppActions.ADCategorySelected(null); }

	onCityMarkerSelected (event) {
		this.closeADImage();
		AppActions.citySelected(event.target.options.id, true);
	}

	onCitySelected (event) {
		this.closeADImage();
		AppActions.citySelected(event.target.id, true);
	}

	onCountrySelected () { AppActions.countrySelected(); }

	onDownloadClicked () {
		this.setState({
			downloadOpen: !this.state.downloadOpen
		});
	}

	onGradeHover (event) { AppActions.gradeSelected(event.target.grade); }

	onGradeUnhover () { AppActions.gradeSelected(null); }

	onHOLCIDClick (event) { AppActions.neighborhoodSelected(event.target.id, this.state.selectedCity); }

	onLegendSelect (legendText) { }

	onMapMoved (event) { AppActions.mapMoved(this.getLeafletElementForMap()); }

	onModalClick (event) {
		const subject = (event.target.id) ? (event.target.id) : null;
		AppActions.onModalClick(subject);
	}

	onNeighborhoodClose() { AppActions.neighborhoodSelected(null, this.state.selectedCity); }

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

	onPanoramaMenuClick () {
		this.setState({
			show_panorama_menu: !this.state.show_panorama_menu
		});
	}

	onSliderChange (value) {
		this.setState({
			raster: {
				opacity: value / 100
			}
		});
	}

	onStateSelected (value, index) {
		// for click on state name in sidebar
		value = (value.target) ? value.target : value;
		const abbr = value.id;
		AppActions.stateSelected(abbr);
	}

	onUserCityResponse(event) {
		if (event.target.value == 'yes') {
			AppActions.citySelected(UserLocationStore.getAdId(), true);
		}
		AppActions.userRespondedToZoomOffer();
	}

	onWindowResize (event) { AppActions.windowResized(); }



	neighborhoodHighlighted (event) {
		AppActions.neighborhoodHighlighted(event.target.id);
	}

	neighborhoodsUnhighlighted () {
		AppActions.neighborhoodHighlighted(null);
	}


	categorySelected (id) {
		this.setState({
			selectedNeighborhood: null,
			selectedCategory: id
		});
	}













	toggleBurgessDiagram () {
		this.setState({
			burgessDiagramVisible: !this.state.burgessDiagramVisible
		});
	}



	closeADImage() {
		this.setState({
			adImageOpen: false
		});
	}

	getLeafletElementForMap() {
		if (this.refs.holc_map) {
			return this.refs.holc_map.refs.the_map.leafletElement;
		} 
		if (this.refs.sidebar_map) {
			return this.refs.sidebar_map.refs.holc_map.refs.the_map.leafletElement;
		}
		return false;
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
			text: this.state.text
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

	getADMaxBounds() {
		const sheets = AreaDescriptionsStore.getSheets(this.state.selectedCity, this.state.selectedNeighborhood);
		switch (sheets) {
			case 1:
				return [[-10,-180],[90,-60]];
			case 2:
				return [[-10,-180],[90,70]];
		}
		
	}

	getLeafletElementForAD() { return (this.refs.the_ad_tiles) ? this.refs.the_ad_tiles.leafletElement : null; }

	downloadGeojson () {
		let geojson = AreaDescriptionsStore.getADsAsGeojson(this.state.selectedCity);
		let blob = new Blob([JSON.stringify(geojson)]); 

		let geojsonURL = window.URL.createObjectURL(blob);
		let tempLink = document.createElement('a');
		tempLink.href = geojsonURL;
		tempLink.setAttribute('download', 'areadescription.geojson');
		tempLink.click();
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
			alphebetizedVisibleStateAbbrs = Object.keys(visibleStates)
				.map(abbr => stateAbbrs[abbr])
				.sort()
				.map(fullName => { 
					return Object.keys(visibleStates).filter(abbr => (fullName == stateAbbrs[abbr]))[0]
				});

		return (
			<div className='container full-height'>
				<Navigation 
					show_menu={ this.state.show_panorama_menu } 
					on_hamburger_click={ this.onPanoramaMenuClick } 
					nav_data={ panoramaNavData.filter((item, i) => item.url.indexOf('holc') === -1) } 
					links={ [
						{ name: 'Digital Scholarship Lab', url: '//dsl.richmond.edu' },
						{ name: 'University of Richmond', url: '//www.richmond.edu' }
					] }
					link_separator=', '
				/>
				<div className='row full-height'>
					<div className='columns eight full-height'>
						<header className='row u-full-width'>
							<h1>
								<span className='header-main'>Mapping Inequality</span>
								<span className='header-sub'>Redlining in New Deal America</span>
							</h1>
							<h4 onClick={ this.onModalClick } id={ 'intro' }>Introduction</h4>
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
									onSliderChange={ this.onSliderChange }
									onCountryClick={ this.onCountrySelected }
								/> :
								<Map 
									ref='the_ad_tiles' 
									center={ [this.getADY(),this.getADX()] } 
									zoom={ this.getADZoom() }
									minZoom={ 3 }
									maxZoom={ 5 }
									maxBounds={ this.getADMaxBounds() }
									className='the_ad'
									style={ DimensionsStore.getADViewerStyle() }
									onMoveend={ this.changeHash }
								>

									{ (AreaDescriptionsStore.hasADImages(this.state.selectedCity)) ? 
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

						</div>
					</div>


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
									adId={ this.state.selectedCity }
									name={ CityStore.getName() }
									state={ CityStore.getState() }
									cityData={ CityStore.getCityData() } 
									area={ AreaDescriptionsStore.getArea(this.state.selectedCity) } 
									gradeStats={ CityStore.getGradeStats() } 
									ringStats={ CityStore.getRingStats() } 
									popStats={ AreaDescriptionsStore.getDisplayPopStats(this.state.selectedCity) }
									areaSelected={ this.onBurgessChartHover } 
									areaUnselected={ this.onBurgessChartOff } 
									gradeSelected={ this.onAreaChartHover } 
									gradeUnselected={ this.onAreaChartOff } 
									openBurgess={ this.onModalClick }
									burgessDiagramVisible={ this.state.burgessDiagramVisible } 
									toggleBurgessDiagram={ this.toggleBurgessDiagram } 
									hasADData={ AreaDescriptionsStore.hasADData(this.state.selectedCity) }
									hasADImages={ AreaDescriptionsStore.hasADImages(this.state.selectedCity) }
									onDownloadClicked={ this.onDownloadClicked }
									onCitySelected={ this. onCitySelected }
									onStateSelected={ this.onStateSelected }
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
									hasADImages={ AreaDescriptionsStore.hasADImages(this.state.selectedCity) }
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
									onSliderChange={ this.onSliderChange }
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

							{ (!this.state.selectedCity && !this.state.selectedNeighborhood && !this.state.selectedCategory && alphebetizedVisibleStateAbbrs.length > 0) ?
								alphebetizedVisibleStateAbbrs.map((theState) => {
									return <StateStats 
										stateName={ stateAbbrs[theState] } 
										stateAbbr={ theState }
										cities={ visibleStates[theState] } 
										onCityClick={ this.onCitySelected }
										onStateClick={ this.onStateSelected }
										key={ theState }
									/>;
								}) :
								''
							}

							{ (this.state.downloadOpen) ?
								<div className='download_menu'>
									<h2>
										<span
											onClick={ this.onCitySelected }
											id={ this.state.selectedCity }
										>
											{ CityStore.getName() + ', '}
										</span>
										<span 
											onClick={ this.onStateSelected } 
											id={ CityStore.getState() }
										>
											{ CityStore.getState() }
										</span>
										<div className='downloadicon' onClick={ this.onDownloadClicked }>x</div>
									</h2>
									<ul>
										{ AreaDescriptionsStore.getMaps(this.state.selectedCity).map(map => {
											if (!RasterStore.isInset(map.id)) {
												return <li className='greentop' key={ 'ungeorectifiedDownload' + map.id }>
													<h3>
														<a 
															href={ RasterStore.getMapUrl(map.id) } 
															download={ map.name.replace(/\s+/g, '') + '_scan.zip'}
														>
															Download map of { map.name } (.jpg)
															<img src={this.props.thumbnail } />
														</a>
													</h3>
											</li>
											}
										}) }
										{ AreaDescriptionsStore.getMaps(this.state.selectedCity).map(map => {
											return <li className='greenmiddle' key={ 'georectifiedDownload' + map.id }>
												<h3>
													<a 
														href={ RasterStore.getRectifiedUrl(map.id) } 
														download={ map.name.replace(/\s+/g, '') + '_rectified.zip'}
													>
														Download georeferenced map of { map.name } (.zip)
													</a>
												</h3>
											</li>
										}) }
										{ (AreaDescriptionsStore.hasADData(this.state.selectedCity)) ?
											<li className='greenbottom'>
												<h3>
													<a onClick={ this.downloadGeojson }>
														Download area description (.geojson)
													</a>
												</h3>
											</li> :
											''
										}
										{ (AreaDescriptionsStore.hasADData(this.state.selectedCity)) ?
											<li className='greensubbottom'>
												<h3>
													<a 
														href={ CityStore.getBucketPath(this.state.selectedCity) + 'area_descriptions.zip' }
														download={ CityStore.getName().replace(/\s+/g, '') + '_area_descriptions.zip' }
													>
														Download area description (.shp)
													</a>
												</h3>
											</li> : 
											''
										}
									</ul>
								</div> : 
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