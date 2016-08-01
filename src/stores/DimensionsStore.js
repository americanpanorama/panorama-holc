import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';

const DimensionsStore = {

	data: {
		containerPadding: 20,
		headerHeight: 100,
		tilesHeight: window.innerHeight - 140, // two paddings + headerHeight
		sidebarTitleBottomMargin: 10,
		adNavHeight: 20,

		sidebarWidth: 0,
		mainPaneWidth: 0,
		sidebarTitleHeight: 0
	},

	computeComponentDimensions () {
		this.data.tilesHeight = window.innerHeight - this.data.headerHeight - 2*this.data.containerPadding;
		this.data.sidebarWidth =(document.getElementsByClassName('dataViewer').length > 0) ? document.getElementsByClassName('dataViewer')[0].offsetWidth : 0;
		this.data.mainPaneWidth = (document.getElementsByClassName('main-pane').length > 0) ? document.getElementsByClassName('main-pane')[0].offsetWidth : 0;
		this.data.sidebarTitleHeight = (document.getElementsByClassName('sidebarTitle').length > 0) ? document.getElementsByClassName('sidebarTitle')[0].offsetHeight: 0;

		this.emit(AppActionTypes.storeChanged);
	},

	getDimensions () {
		return this.data;
	},

	getMainPaneStyle: function() {
		return { height: this.data.tilesHeight + 'px' };
	},

	getSidebarHeightStyle: function() {
		// same as the main panel style as it's just the height
		return this.getMainPaneStyle();
	},

	getADViewerStyle: function() {
		return {
			height: (this.data.tilesHeight - this.data.containerPadding * 2) + 'px',
			width: (this.data.mainPaneWidth - this.data.containerPadding * 2) + 'px'
		}
	},

	// this needs to be redone

	getSearchStyle: function() {
		return {
			width: (window.innerWidth / 3 - 2 * this.data.containerPadding) + 'px',
			height: (window.innerHeight - 2 * this.data.containerPadding) + 'px'
		}
	},

	getADNavPreviousStyle: function() {
		return {
			width: this.data.tilesHeight + 'px',
			top: ((this.data.tilesHeight + this.data.containerPadding) / 2 + this.data.headerHeight) + 'px',
			right: (this.data.containerPadding * 1.5 - this.data.tilesHeight / 2 + this.data.sidebarWidth - this.data.adNavHeight) + 'px'
		}
	},

	getADNavNextStyle: function() {
		return {
			width: this.data.tilesHeight + 'px',
			top: ((this.data.tilesHeight + this.data.containerPadding) / 2 + this.data.headerHeight) + 'px',
			right: (this.data.containerPadding * 1.5 - this.data.tilesHeight / 2) + 'px'
		}
	},

	getSidebarMapStyle: function() {
		return {
			width: (this.data.sidebarWidth - 2*this.data.adNavHeight) + 'px',
			height: (this.data.tilesHeight - this.data.sidebarTitleHeight - this.data.sidebarTitleBottomMargin - 2*this.data.containerPadding) + 'px'
		}
	}


}

// Mixin EventEmitter functionality
Object.assign(DimensionsStore, EventEmitter.prototype);

// Register callback to handle all updates
DimensionsStore.dispatchToken = AppDispatcher.register((action) => {

	switch (action.type) {
		case AppActionTypes.loadInitialData:
		case AppActionTypes.mapInitialized:
		case AppActionTypes.windowResized:
			DimensionsStore.computeComponentDimensions();
			break;
	}
});

export default DimensionsStore;