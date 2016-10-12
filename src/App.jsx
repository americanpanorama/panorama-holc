import * as React from 'react';
import "babel-polyfill";

// stores
import AreaDescriptionsStore from './stores/AreaDescriptionsStore';
import CitiesStore from './stores/CitiesStore';
import CityStore from './stores/CityStore';
import DimensionsStore from './stores/DimensionsStore';
import MapStateStore from './stores/MapStateStore';
import RasterStore from './stores/RasterStore';
import UserLocationStore from './stores/UserLocationStore';
import TextsStore from './stores/TextsStore';

// components (views)
import ADCat from './components/ADCat.jsx';
import AreaDescription from './components/AreaDescription.jsx';
import Burgess from './components/Burgess.jsx';
import { CartoDBTileLayer, HashManager, Legend, Navigation } from '@panorama/toolkit';
import CitySnippet from './components/CitySnippet.jsx';
import CityStats from './components/CityStats.jsx';
import ContactUs from './components/ContactUs.jsx';
import { icon } from 'leaflet';
import { Map, LayerGroup, TileLayer } from 'react-leaflet';
import Slider from 'rc-slider';
import StateList from './components/StateList.jsx';
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
		initialHashState: HashManager.getState()
	};

	constructor (props) {
		super(props);
		this.state = this.getDefaultState();

		// bind handlers
		const handlers = ['changeHash', 'downloadGeojson', 'getLeafletElementForMap', 'onAdImageClicked', 'onAreaChartHover', 'onAreaChartOff', 'onBringToFrontClick', 'onBurgessChartHover', 'onBurgessChartOff', 'onCategoryClick', 'onCategoryClose', 'onCityMarkerSelected', 'onCitySelected', 'onContactUsToggle', 'onCountrySelected', 'onDownloadClicked', 'onGradeHover', 'onGradeUnhover', 'onHOLCIDClick', 'onMapMoved', 'onModalClick', 'onNeighborhoodClose', 'onNeighborhoodHighlighted', 'onNeighborhoodPolygonClick', 'onNeighborhoodUnhighlighted', 'onPanoramaMenuClick', 'onSliderChange', 'onStateSelected', 'onToggleADView', 'onUserCityResponse', 'onWindowResize', 'storeChanged','onMapClick'];
		handlers.map(handler => { this[handler] = this[handler].bind(this); });
	}

	/* Lifecycle methods */

	componentWillMount () {
		AppActions.loadInitialData(this.state, HashManager.getState());

		//try to retrieve the users location
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((position) => {
				console.log(position);
				AppActions.userLocated([position.coords.latitude, position.coords.longitude]);
			}, (error) => {
				console.warn('Geolocation error occurred. Error code: ' + error.code);
			});
		}
	}

	componentDidMount () {
		window.addEventListener('resize', this.onWindowResize);
		AreaDescriptionsStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		CitiesStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		CityStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		DimensionsStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		MapStateStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		RasterStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		UserLocationStore.addListener(AppActionTypes.storeChanged, this.storeChanged);
		TextsStore.addListener(AppActionTypes.storeChanged, this.storeChanged);

		AppActions.mapInitialized(this.getLeafletElementForMap(), this.props.initialHashState);

		// // you have to wait until there's a map to query to get and initialize the visible maps
		// const waitingId = setInterval(() => {
		// 	if (RasterStore.hasLoaded() && AreaDescriptionsStore.hasLoaded()) {
		// 		clearInterval(waitingId);
		// 		AppActions.mapInitialized(this.getLeafletElementForMap(), this.props.requestedZoom);
		// 	}
		// }, 10);
	}

	componentWillUnmount () { }

	componentDidUpdate () { this.changeHash(); }

	/* state methods */

	getDefaultState () {
		const hashState = HashManager.getState();

		return {
			adImageOpen: (hashState.adimage),
			contactUs: false,
			downloadOpen: false,
			highlightedNeighborhood: null,
			map: {
				zoom: (hashState.loc && hashState.loc.zoom) ? hashState.loc.zoom : 5,
				center: (hashState.loc && hashState.loc.center) ? hashState.loc.center : [39.1045,-94.5832] 
			},
			rasterOpacity: (hashState.opacity) ? parseFloat(hashState.opacity) : 0.8,
			selectedCategory: (hashState.category) ? hashState.category : null,
			selectedCity: null, 
			selectedGrade: null,
			selectedNeighborhood: (hashState.area) ? hashState.area : null,
			selectedRingGrade: { 
				ringId: null, 
				grade: null
			},
			text: (hashState.text) ? hashState.text : null,
			unselectedVisibleCities: []
		};
	}

	storeChanged (options = {}) {
		this.setState({
			adImageOpen: ((!CityStore.getSelectedHolcId() || !CityStore.getId()) && CityStore.hasLoaded() && MapStateStore.hasLoaded()) ? false : this.state.adImageOpen,
			highlightedNeighborhood: CityStore.getHighlightedHolcId(),
			map: {
				center: MapStateStore.getCenter(),
				zoom: MapStateStore.getZoom()
			},
			selectedCategory: CityStore.getSelectedCategory(),
			selectedCity: CityStore.getId(),
			selectedGrade: CityStore.getSelectedGrade(),
			selectedNeighborhood: CityStore.getSelectedHolcId(),
			selectedRingGrade: CityStore.getSelectedRingGrade(),
			text: TextsStore.getSubject(),
			unselectedVisibleCities: MapStateStore.getVisibleAdIds().map(adId => CitiesStore.getFullCityMetadata(adId)).filter(cityMetadata => (cityMetadata.ad_id !== CityStore.getId()))
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

	onBringToFrontClick (event) {
		AppActions.mapClicked();
	}

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
		event.preventDefault(); /* important as this is sometimes used in an a href there only for indexing */
		this.closeADImage();
		AppActions.onModalClick(null);
		AppActions.citySelected(event.target.id, true);
	}

	onContactUsToggle () {
		this.setState({
			contactUs: !this.state.contactUs
		});
		AppActions.onModalClick(null);
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

	onMapClick (event) { 
		this.refs.holc_map.refs['holctiles' + event.target.options.id].leafletElement.bringToFront();
		AppActions.mapClicked(event.target.options.id); 
	}

	onMapMoved (event) { AppActions.mapMoved(this.getLeafletElementForMap()); }

	onModalClick (event) {
		const subject = (event.target.id) ? (event.target.id) : null;
		AppActions.onModalClick(subject);
		this.setState({
			contactUs: null
		});
	}

	onNeighborhoodClose() { AppActions.neighborhoodSelected(null, this.state.selectedCity); }

	onNeighborhoodHighlighted (event) {
		AppActions.neighborhoodHighlighted(event.target.id);
		this.bringMapForNeighborhoodToFront(this.selectedCity, event.target.id);
	}

	onNeighborhoodUnhighlighted () {
		AppActions.neighborhoodHighlighted(null);
	}

	onNeighborhoodPolygonClick (event) {
		let neighborhoodId = event.target.options.neighborhoodId,
			adId = parseInt(event.target.options.adId);

		// clicking on a selected neighborhood deselects it and closes the adImage if it's open
		if (neighborhoodId == this.state.selectedNeighborhood && adId == this.state.selectedCity) {
			neighborhoodId = null;
			this.closeADImage();
		} 
		AppActions.neighborhoodSelected(neighborhoodId, adId);

		this.bringMapForNeighborhoodToFront(adId, neighborhoodId);
	}

	onPanoramaMenuClick () {
		this.setState({
			show_panorama_menu: !this.state.show_panorama_menu
		});
	}

	onSliderChange (value) {
		this.setState({
			rasterOpacity: value / 100
		});
	}

	onStateSelected (value, index) {
		// for click on state name in sidebar
		value = (value.target) ? value.target : value;
		const abbr = value.id;
		AppActions.stateSelected(abbr);
	}

	onToggleADView () {
		AppActions.toggleADView();
	}

	onUserCityResponse(event) {
		if (event.target.value == 'yes') {
			AppActions.citySelected(UserLocationStore.getAdId(), true);
		}
		AppActions.userRespondedToZoomOffer();
	}

	onWindowResize (event) { AppActions.windowResized(); }

	closeADImage() {
		this.setState({
			adImageOpen: false
		});
	}

	bringMapForNeighborhoodToFront(adId, neighborhoodId) {
		const mapIds = AreaDescriptionsStore.getNeighborhoodMapIds(adId, neighborhoodId),
			sortOrder = MapStateStore.getSortOrder();

		// check to see if the top maps match the applicable ones; do if they don't bring them to the top
		if (mapIds.length > 0 && neighborhoodId !== null && JSON.stringify(mapIds.concat().sort()) !== JSON.stringify(sortOrder.slice(0, mapIds.length).sort())) {
			// if there's only one map, bring it to the front if it isn't already
			mapIds.reverse().forEach(mapId => {
				this.refs.holc_map.refs['holctiles' + mapId].leafletElement.bringToFront();
				AppActions.mapClicked(mapId);
			});
		}
	}

	/* manage hash */

	changeHash () {
		HashManager.updateHash({ 
			adimage: (this.state.adImageOpen) ? this.formatADHashState() : null,
			area: this.state.selectedNeighborhood,
			category: this.state.selectedCategory,
			city: CityStore.getSlug(),
			loc: {
				zoom: this.state.map.zoom,
				center: this.state.map.center
			},
			opacity: this.state.rasterOpacity,
			text: this.state.text,
			sort: (MapStateStore.getSortOrder().length > 0) ? MapStateStore.getSortOrder() : null,
			adview: (AreaDescriptionsStore.show() == 'full') ? 'full' : null
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

	getCatLetter() { return (this.state.selectedCategory) ? this.state.selectedCategory.split('-')[1] : null; }

	getCatNum() { return (this.state.selectedCategory) ? this.state.selectedCategory.split('-')[0] : null; }

	getLeafletElementForAD() { return (this.refs.the_ad_tiles) ? this.refs.the_ad_tiles.leafletElement : null; }

	getLeafletElementForMap() {
		if (this.refs.sidebar_map) {
			return this.refs.sidebar_map.refs.holc_map.refs.the_map.leafletElement;
		}
		if (this.refs.holc_map) {
			return this.refs.holc_map.refs.the_map.leafletElement;
		} 
		
		return false;
	}

	downloadGeojson () {
		let geojson = AreaDescriptionsStore.getADsAsGeojson(this.state.selectedCity),
			blob = new Blob([JSON.stringify(geojson)]),
			geojsonURL = window.URL.createObjectURL(blob),
			tempLink = document.createElement('a');
		tempLink.href = geojsonURL;
		tempLink.setAttribute('download', 'areadescription.geojson');
		tempLink.click();
	}

	render () {

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
							<h4 onClick={ this.onModalClick } id={ 'bibliograph' }>Bibliographic Note & Bibliography</h4>
							<h4 onClick={ this.onModalClick } id={ 'about' }>About</h4>
							<h4 onClick={ this.onContactUsToggle }>Contact Us</h4>
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
									selectedCity = { this.state.selectedCity }
									onMapMoved={ this.onMapMoved }
									onNeighborhoodPolygonClick={ this.onNeighborhoodPolygonClick }
									onNeighborhoodInvertedPolygonClick={ this.onNeighborhoodClose }
									onCityMarkerSelected= { this.onCityMarkerSelected }
									onSliderChange={ this.onSliderChange }
									onCountryClick={ this.onCountrySelected }
									onMapClick={ this.onMapClick }
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
									{ (CitiesStore.hasADImages(this.state.selectedCity) && AreaDescriptionsStore.getAdTileUrl(this.state.selectedCity, this.state.selectedNeighborhood)) ? 
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

							{ TextsStore.mainModalIsOpen() && TextsStore.getSubject() !== 'burgess' ?
								<div className='longishform'>
									<button className='close' onClick={ this.onModalClick }><span>×</span></button>
									<div className='content' dangerouslySetInnerHTML={ TextsStore.getModalContent() } />
								</div> :
								null
							}

							{ TextsStore.mainModalIsOpen() && TextsStore.getSubject() == 'burgess' ?
								<div className='longishform'>
									<Burgess 
										onCitySelected={ this.onCitySelected } 
										onModalClick={ this.onModalClick }
									/>
								</div> :
								null
							}

							{ (this.state.contactUs) ?
								<ContactUs onContactUsToggle={ this.onContactUsToggle }/> :
								''
							}

							{ UserLocationStore.getOfferZoomTo() ?
								<div className='longishform'>
									<p>Would you like to zoom to { UserLocationStore.getCity() }?</p>
									<button onClick={ this.onUserCityResponse } value={ 'yes' }>Sure</button>
									<button onClick={ this.onUserCityResponse } value={ 'no' }>No thanks</button>
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
								options={ CitiesStore.getADsList() }
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

							{ (!this.state.selectedNeighborhood && !this.state.selectedCategory && this.state.selectedCity) ?
								<CityStats 
									adId={ this.state.selectedCity }
									name={ CityStore.getName() }
									state={ CityStore.getState() }
									slug={ CityStore.getSlug() }
									area={ AreaDescriptionsStore.getArea(this.state.selectedCity) } 
									gradeStats={ CityStore.getGradeStats() } 
									ringStats={ CityStore.getRingStats() } 
									popStats={ CitiesStore.getDisplayPopStats(this.state.selectedCity) }
									areaSelected={ this.onBurgessChartHover } 
									areaUnselected={ this.onBurgessChartOff } 
									gradeSelected={ this.onAreaChartHover } 
									gradeUnselected={ this.onAreaChartOff } 
									openBurgess={ this.onModalClick }
									hasADData={ CitiesStore.hasADData(this.state.selectedCity) }
									hasADImages={ CitiesStore.hasADImages(this.state.selectedCity) }
									onDownloadClicked={ this.onDownloadClicked }
									onCitySelected={ this. onCitySelected }
									onStateSelected={ this.onStateSelected }
									downloadOpen={ this.state.downloadOpen }
									rasters={ RasterStore.getMapsFromIds(CitiesStore.getMapIds(this.state.selectedCity)) }
									downloadGeojson = { this.downloadGeojson }
									bucketPath={ CityStore.getBucketPath(this.state.selectedCity) }
								/> :
								''
							}

							{ (!this.state.selectedNeighborhood && !this.state.selectedCategory && this.state.selectedCity && this.state.unselectedVisibleCities.length > 0) ?
								<div>
									<h4>Other Visible Cities</h4>
									{ Object.keys(this.state.unselectedVisibleCities).map(i => {
										return (
											<CitySnippet 
												cityData={ this.state.unselectedVisibleCities[i] } 
												onCityClick={ this.onCitySelected } 
												key={ 'city' + this.state.unselectedVisibleCities[i].ad_id } 
											/> 
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
									neighborhoodNames={ AreaDescriptionsStore.getNeighborhoodNames(this.state.selectedCity) }
									areaDescriptions={ AreaDescriptionsStore.getADsForNeighborhood(this.state.selectedCity, this.state.selectedNeighborhood) } 
									thumbnailUrl={ AreaDescriptionsStore.getThumbnailUrl(this.state.selectedCity, this.state.selectedNeighborhood) }
									formId={ CityStore.getFormId() } 
									cityId={ this.state.selectedCity }
									citySlug={ CityStore.getSlug() }
									hasADImages={ CitiesStore.hasADImages(this.state.selectedCity) }
									onCategoryClick={ this.onCategoryClick } 
									onHOLCIDClick={ this.onHOLCIDClick } 
									onAdImageClicked={ this.onAdImageClicked }
									onToggleADView={ this.onToggleADView }
									onClose={ this.onNeighborhoodClose }
									ref={'areadescription' + this.state.selectedNeighborhood } 
									previousStyle={ DimensionsStore.getADNavPreviousStyle() }
									nextStyle={ DimensionsStore.getADNavNextStyle() }
									show={ AreaDescriptionsStore.show() }
								/> : 
								''
							}

							{ (this.state.selectedNeighborhood && this.state.adImageOpen) ? 
								<SidebarMap
									ref='sidebar_map'
									state={ this.state }
									selectedCity = { this.state.selectedCity }
									onMapMoved={ this.onMapMoved }
									onNeighborhoodPolygonClick={ this.onNeighborhoodPolygonClick }
									onCityMarkerSelected= { this.onCityMarkerSelected }
									areaId={ this.state.selectedNeighborhood } 
									previousAreaId={ AreaDescriptionsStore.getPreviousHOLCId(this.state.selectedCity, this.state.selectedNeighborhood) }
									nextAreaId={ AreaDescriptionsStore.getNextHOLCId(this.state.selectedCity, this.state.selectedNeighborhood) }
									neighborhoodNames={ AreaDescriptionsStore.getNeighborhoodNames(this.state.selectedCity) }
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
									ADsByCat={ AreaDescriptionsStore.getADsForCategory(this.state.selectedCity, this.state.selectedCategory) }
									neighborhoodNames={ AreaDescriptionsStore.getNeighborhoodNames(this.state.selectedCity) }
									formId = { AreaDescriptionsStore.getFormId(this.state.selectedCity) }
									title={ AreaDescriptionsStore.getCatTitle(this.state.selectedCity, this.getCatNum(), this.getCatLetter()) }
									catNum={ this.getCatNum() } 
									catLetter = { this.getCatLetter() } 
									previousCatIds = { AreaDescriptionsStore.getPreviousCatIds(this.state.selectedCity, this.getCatNum(), this.getCatLetter()) }
									nextCatIds = { AreaDescriptionsStore.getNextCatIds(this.state.selectedCity, this.getCatNum(), this.getCatLetter()) }
									cityId={ this.state.selectedCity }
									onNeighborhoodClick={ this.onHOLCIDClick } 
									onCategoryClick={ this.onCategoryClick } 
									onNeighborhoodHover={ this.onNeighborhoodHighlighted } 
									onNeighborhoodOut={ this.onNeighborhoodUnhighlighted } 
									previousStyle={ DimensionsStore.getADNavPreviousStyle() }
									nextStyle={ DimensionsStore.getADNavNextStyle() }
									onClose={ this.onCategoryClose }
								/> :
								''
							}

							{ (!this.state.selectedCity && !this.state.selectedNeighborhood && !this.state.selectedCategory) ?
								MapStateStore.getVisibleStateAbbrs().map((abbr) => {
									return <StateList 
										stateName={ stateAbbrs[abbr] } 
										stateAbbr={ abbr }
										cities={ MapStateStore.getVisibleCitiesForState(abbr) } 
										onCityClick={ this.onCitySelected }
										onStateClick={ this.onStateSelected }
										key={ abbr }
									/>;
								}) :
								''
							}

						</div>
					</div>
				</div>
			</div> 
		);

	}
}