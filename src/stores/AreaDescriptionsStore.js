import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import formsMetadata from '../../data/formsMetadata.json';


const AreaDescriptionsStore = {

	data: {
		adIds: [],
		areaDescriptions: {}
	},

	dataLoader: CartoDBLoader,

	loadData: function (adIds) {

		this.data.adIds = adIds.map(adId => parseInt(adId));

		// create queries for those that aren't already in memory
		let queries = [];
		adIds.forEach(adId => {
			if (!this.data.areaDescriptions[adId]) {
				queries.push({
					query: 'SELECT holc_ads.id as ad_id, holc_id, holc_grade, polygon_id, cat_id, sub_cat_id, _order as order, data, ST_asgeojson (holc_polygons.the_geom, 4) as the_geojson, st_xmin(st_envelope(digitalscholarshiplab.holc_polygons.the_geom)) as bbxmin, st_ymin(st_envelope(digitalscholarshiplab.holc_polygons.the_geom)) as bbymin, st_xmax(st_envelope(digitalscholarshiplab.holc_polygons.the_geom)) as bbxmax, st_ymax(st_envelope(digitalscholarshiplab.holc_polygons.the_geom)) as bbymax,st_area(holc_polygons.the_geom::geography)/1000000 * 0.386102 as sqmi FROM holc_ad_data right join holc_polygons on holc_ad_data.polygon_id = holc_polygons.neighborhood_id join holc_ads on holc_ads.id = holc_polygons.ad_id where holc_ads.id = ' + adId + ' order by holc_id, cat_id, sub_cat_id, _order',
					format: 'JSON'
				});
			}
		});

		this.dataLoader.query(queries).then((responses) => {
			responses.forEach(response => {
				if (response.length > 0) {
					const adId = response[0].ad_id;
					this.data.areaDescriptions[adId] = {
						byNeighborhood: this.parseAreaDescriptions(response)
					};
					this.data.areaDescriptions[adId].byCategory = this.parseADsByCat(this.data.areaDescriptions[adId].byNeighborhood);
				}
			});

			this.emit(AppActionTypes.storeChanged);

		}, (error) => {
			// TODO: handle this.
			console.log('AreaDescriptionsStore received error:', error);
			throw error;
		});
	},

	parseAreaDescriptions: function(rawAdData) {
		let adData = {};

		for(var row in rawAdData) {
			let d = rawAdData[row];

			// define id if undefined
			if(typeof adData[d.holc_id] == 'undefined') {
				adData[d.holc_id] = {};
			}
			// assign properties    
			adData[d.holc_id].area_geojson = (!adData[d.holc_id].area_geojson) ? JSON.parse(d.the_geojson) : adData[d.holc_id].area_geojson;
			adData[d.holc_id].area_geojson_inverted = (!adData[d.holc_id].area_geojson_inverted) ? this.parseInvertedGeoJson(JSON.parse(d.the_geojson)) : adData[d.holc_id].area_geojson_inverted;
			adData[d.holc_id].boundingBox = [[d.bbxmin,d.bbymin],[d.bbxmax,d.bbymax]];
			//adData[d.holc_id].name = d.name;
			adData[d.holc_id].holc_grade = d.holc_grade;
			adData[d.holc_id].sqmi = d.sqmi;
			
			// define area description if undefined
			if(typeof adData[d.holc_id].areaDesc == 'undefined') {
				adData[d.holc_id].areaDesc = {};
			}
			
			// define category id for area description if undefined
			if (d.cat_id && d.sub_cat_id === '' && d.order === null) {
				adData[d.holc_id].areaDesc[d.cat_id] = d.data;
			} else if(d.cat_id && typeof adData[d.holc_id].areaDesc[d.cat_id] === 'undefined') {
				adData[d.holc_id].areaDesc[d.cat_id] = {};
			}
			// check for subcategories
			if(d.sub_cat_id) {
				// create sub-object if we have a subcategory...
				if(typeof adData[d.holc_id].areaDesc[d.cat_id][d.sub_cat_id] == 'undefined') {
					//console.log(d, adData[d.holc_id]);
					adData[d.holc_id].areaDesc[d.cat_id][d.sub_cat_id] = {};

					// look for order
					if(d.order) {
						adData[d.holc_id].areaDesc[d.cat_id][d.sub_cat_id][d.order] =d.data;
					} else {
						adData[d.holc_id].areaDesc[d.cat_id][d.sub_cat_id] = d.data;
					}
				}
			} 

			// look for order
			else if (d.order) { 
				adData[d.holc_id].areaDesc[d.cat_id][d.order] = rawAdData[row].data;
			} 

			if (Object.keys(adData[d.holc_id].areaDesc).length === 0) {
				adData[d.holc_id].areaDesc = false;
			}

		}  // end if

		return adData;
	},

	parseADsByCat: function(ADs) {
		let ADsByCat = {};
		Object.keys(ADs).forEach(function(neighborhoodId) {
			Object.keys(ADs[neighborhoodId].areaDesc).forEach(function(cat) {
				// initialize if necessary
				ADsByCat[cat] = ADsByCat[cat] || {};
				if (typeof(ADs[neighborhoodId].areaDesc[cat]) == 'string') {
					ADsByCat[cat][neighborhoodId] = ADs[neighborhoodId].areaDesc[cat];
				} else if (typeof(ADs[neighborhoodId].areaDesc[cat]) == 'object') {
					Object.keys(ADs[neighborhoodId].areaDesc[cat]).forEach(function (subcat) {
						ADsByCat[cat][subcat] = ADsByCat[cat][subcat] || {};
						ADsByCat[cat][subcat][neighborhoodId] = ADs[neighborhoodId].areaDesc[cat][subcat];
					});
				}
			});
		});

		return ADsByCat;
	},

	parseInvertedGeoJson: function(geojson) {
		//Create a new set of latlngs, adding our world-sized ring first
		let NWHemisphere = [[0,0], [0, 90], [-180, 90], [-180, 0], [0,0]],
			newLatLngs = [ NWHemisphere ],
			holes =[];

		geojson.coordinates.forEach((polygon, i) => {
			polygon.forEach((polygonpieces, i2) => {
				if (i2 == 0) {
					newLatLngs.push(polygonpieces);
				} else {
					holes.push(polygonpieces);
				}
			});
		});
		geojson.coordinates = (holes.length > 0) ? [newLatLngs.concat(holes)] : [newLatLngs]
		return geojson;
	},

	getAreaDescriptions: function() {
		return this.data.areaDescriptions;
	},

	getADs: function(adId) {
		return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].byNeighborhood : false;
	},

	getADsForNeighborhood: function(adId, holcId) {
		return (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood[holcId]) ? this.data.areaDescriptions[adId].byNeighborhood[holcId].areaDesc : false;
	},

	getVisible: function() {
		let ADs = {};
		this.data.adIds.forEach(adId => {
			if (this.data.areaDescriptions[adId]) {
				ADs[adId] = this.data.areaDescriptions[adId].byNeighborhood;
			}
		});
		return ADs;
	},

	getVisibleMapIds: function() {
		return this.data.adIds;
	}

};

// Mixin EventEmitter functionality
Object.assign(AreaDescriptionsStore, EventEmitter.prototype);

// Register callback to handle all updates
AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			if (action.state.selectedCity) {
				AreaDescriptionsStore.loadData([action.state.selectedCity]);
			}
			break;

		case AppActionTypes.mapMoved:
			if (action.value) {
				AreaDescriptionsStore.loadData(action.value);
			}
			break;
	}


	return true;

});


export default AreaDescriptionsStore;