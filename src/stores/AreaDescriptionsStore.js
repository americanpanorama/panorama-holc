import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import formsMetadata from '../../data/formsMetadata.json';
import MapStateStore from '../stores/MapStateStore';


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
					query: 'SELECT holc_ads.city_id as ad_id, form_id, holc_id, holc_grade, polygon_id, cat_id, sub_cat_id, _order as order, data, ST_asgeojson (holc_polygons.the_geom, 4) as the_geojson, st_xmin(st_envelope(digitalscholarshiplab.holc_polygons.the_geom)) as bbxmin, st_ymin(st_envelope(digitalscholarshiplab.holc_polygons.the_geom)) as bbymin, st_xmax(st_envelope(digitalscholarshiplab.holc_polygons.the_geom)) as bbxmax, st_ymax(st_envelope(digitalscholarshiplab.holc_polygons.the_geom)) as bbymax,st_area(holc_polygons.the_geom::geography)/1000000 * 0.386102 as sqmi FROM holc_ad_data right join holc_polygons on holc_ad_data.polygon_id = holc_polygons.neighborhood_id join holc_ads on holc_ads.city_id = holc_polygons.ad_id where holc_ads.city_id = ' + adId + ' order by holc_id, cat_id, sub_cat_id, _order',
					format: 'JSON'
				});
			}
		});

		this.dataLoader.query(queries).then((responses) => {
			responses.forEach(response => {
				if (response.length > 0) {
					const adId = response[0].ad_id;
					this.data.areaDescriptions[adId] = {
						formId: response[0].form_id,
						byNeighborhood: this.parseAreaDescriptions(response)
					};
					this.data.areaDescriptions[adId].byCategory = this.parseADsByCat(this.data.areaDescriptions[adId].byNeighborhood);
					this.data.areaDescriptions[adId].area = Object.keys(this.data.areaDescriptions[adId].byNeighborhood).map((HOLCId, i) => this.data.areaDescriptions[adId].byNeighborhood[HOLCId].sqmi ).reduce((a,b) => a+b, 0);
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

	getGeoJsonForGrade: function(adId, grade) {
		let polygons = [[[0,0], [0, 90], [-180, 90], [-180, 0], [0,0]]],
			holes = [];
		Object.keys(this.data.areaDescriptions[adId].byNeighborhood).forEach((id, i) => {
			if (this.data.areaDescriptions[adId].byNeighborhood[id].holc_grade == grade) {
				this.data.areaDescriptions[adId].byNeighborhood[id].area_geojson.coordinates[0].forEach((coords, i2) => {
					if (i2 == 0) {
						polygons.push(coords);
					} else {
						holes.push(coords);
					}
				});
			}
		});

		polygons = (holes.length > 0) ? [polygons.concat(holes)] : [polygons]

		let geojson = {
			'type': 'Feature',
			'geometry': {
				'type': 'MultiPolygon',
				'coordinates': polygons
			},
			'properties': {}
		};

		return geojson;
	},

	getADsForNeighborhood: function(adId, holcId) {
		return (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood[holcId]) ? this.data.areaDescriptions[adId].byNeighborhood[holcId].areaDesc : false;
	},

	getADsForCategory: function(adId, category) {
		if (!this.data.areaDescriptions[adId]) {
			return null;
		}

		let [catNum, catLetter] = category.split('-');

		if (!catNum) {
			return this.data.areaDescriptions[adId].byCategory;
		}

		if (!catLetter && this.data.areaDescriptions[adId].byCategory[catNum]) {
			return this.data.areaDescriptions[adId].byCategory[catNum];
		} else if (catLetter && this.data.areaDescriptions[adId].byCategory[catNum] && this.data.areaDescriptions[adId].byCategory[catNum][catLetter]) {
			return this.data.areaDescriptions[adId].byCategory[catNum][catLetter];
		}
		
		return null;
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
	},

	getArea: function(adId) {
		return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].area : null;
	},

	getPreviousHOLCId: function(adId, HOLCId) {
		let formIds = Object.keys(this.data.areaDescriptions[adId].byNeighborhood).sort(this.alphanumCase);
		return formIds[formIds.indexOf(HOLCId) - 1];
	},

	getNextHOLCId: function(adId, HOLCId) {
		let formIds = Object.keys(this.data.areaDescriptions[adId].byNeighborhood).sort(this.alphanumCase);
		return formIds[formIds.indexOf(HOLCId) + 1];
	},

	getFormId: function(adId) {
		return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].formId : null;
	},

	getPreviousCatIds: function(adId, catNum, catLetter) {
		if (!this.data.areaDescriptions[adId]) {
			return null;
		}

		const formId = this.data.areaDescriptions[adId].formId;
		for (let checkCatNum = (!catLetter) ? parseInt(catNum) - 1 : parseInt(catNum); checkCatNum >= 1; checkCatNum--) {
			for (let checkCatLetter = (!catLetter || catLetter == 'a') ? 'z' : String.fromCharCode(catLetter.charCodeAt()-1); checkCatLetter >= 'a'; checkCatLetter = String.fromCharCode(checkCatLetter.charCodeAt()-1), catLetter = undefined) {
				if (typeof(formsMetadata[formId][checkCatNum]) === 'string') {
					return [checkCatNum, undefined];
				} else if (formsMetadata[formId][checkCatNum] && formsMetadata[formId][checkCatNum].subcats && typeof(formsMetadata[formId][checkCatNum].subcats[checkCatLetter]) === 'string') {
					return [checkCatNum, checkCatLetter];
				}
			}
		}

		return false;
	},

	getNextCatIds: function(adId, catNum, catLetter) {
		if (!this.data.areaDescriptions[adId]) {
			return null;
		}

		const formId = this.data.areaDescriptions[adId].formId;
		for (let checkCatNum = (!catLetter) ? parseInt(catNum) + 1 : parseInt(catNum); checkCatNum < 30; checkCatNum++) {
			for (let checkCatLetter = (!catLetter || catLetter == 'z') ? 'a' : String.fromCharCode(catLetter.charCodeAt()+1); checkCatLetter <= 'z'; checkCatLetter = String.fromCharCode(checkCatLetter.charCodeAt()+1), catLetter = undefined) {
				if (typeof(formsMetadata[formId][checkCatNum]) === 'string') {
					return [checkCatNum, undefined];
				} else if (formsMetadata[formId][checkCatNum] && formsMetadata[formId][checkCatNum].subcats && typeof(formsMetadata[formId][checkCatNum].subcats[checkCatLetter]) === 'string') {
					return [checkCatNum, checkCatLetter];
				}
			}
		}

		return false;
	},

	getCatTitle: function(adId, cat, subcat) {
		if (!this.data.areaDescriptions[adId]) {
			return null;
		}

		const formId = this.data.areaDescriptions[adId].formId;
		if (!subcat) {
			return cat + ' ' + formsMetadata[formId][cat];
		} else if (subcat) {
			return cat + subcat + ' ' + formsMetadata[formId][cat].header + ((formsMetadata[formId][cat].subcats[subcat] !== '') ? ': ' + formsMetadata[formId][cat].subcats[subcat] : '');
		} else {
			return null;
		}
	},

	hasADData: function(adId) {
		return (this.data.areaDescriptions[adId]);
	},

	/* alphanum.js (C) Brian Huisman
	* Based on the Alphanum Algorithm by David Koelle
	* The Alphanum Algorithm is discussed at http://www.DaveKoelle.com
	*
	* Distributed under same license as original
	* 
	* This library is free software; you can redistribute it and/or
	* modify it under the terms of the GNU Lesser General Public
	* License as published by the Free Software Foundation; either
	* version 2.1 of the License, or any later version.
	* 
	* This library is distributed in the hope that it will be useful,
	* but WITHOUT ANY WARRANTY; without even the implied warranty of
	* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
	* Lesser General Public License for more details.
	* 
	* You should have received a copy of the GNU Lesser General Public
	* License along with this library; if not, write to the Free Software
	* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
	*/
	alphanumCase: function(a, b) {
		function chunkify(t) {
			var tz = new Array();
			var x = 0, y = -1, n = 0, i, j;
			while (i = (j = t.charAt(x++)).charCodeAt(0)) {
				var m = (i == 46 || (i >=48 && i <= 57));
				if (m !== n) {
					tz[++y] = '';
					n = m;
				}
				tz[y] += j;
			}
			return tz;
		}

		var aa = (a.neighborhoodId) ? chunkify(a.neighborhoodId.toLowerCase()) : chunkify(a.toLowerCase());
		var bb = (b.neighborhoodId) ? chunkify(b.neighborhoodId.toLowerCase()) : chunkify(b.toLowerCase());	
		for (let x = 0; aa[x] && bb[x]; x++) {
			if (aa[x] !== bb[x]) {
				var c = Number(aa[x]), d = Number(bb[x]);
				if (c == aa[x] && d == bb[x]) {
					return c - d;
				} else return (aa[x] > bb[x]) ? 1 : -1;
			}
		}
		return aa.length - bb.length;
	}

};

// Mixin EventEmitter functionality
Object.assign(AreaDescriptionsStore, EventEmitter.prototype);

// Register callback to handle all updates
AppDispatcher.register((action) => {



	switch (action.type) {

		case AppActionTypes.loadInitialData:
			AppDispatcher.waitFor([MapStateStore.dispatchToken]);
			if (action.state.selectedCity && MapStateStore.isAboveZoomThreshold()) {
				AreaDescriptionsStore.loadData([action.state.selectedCity]);
			}
			break;

		case AppActionTypes.mapMoved:
			AppDispatcher.waitFor([MapStateStore.dispatchToken]);

			let visibleHOLCMapsIds = MapStateStore.getVisibleHOLCMapsIds();

			if (visibleHOLCMapsIds && MapStateStore.isAboveZoomThreshold()) {
				AreaDescriptionsStore.loadData(visibleHOLCMapsIds);
			}
			break;
	}


	return true;

});


export default AreaDescriptionsStore;