import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import formsMetadata from '../../data/formsMetadata.json';
import CitiesStore from './CitiesStore';
import MapStateStore from './MapStateStore';
import RasterStore from './RasterStore';
import stateAbbrs from '../../data/state_abbr.json';

const AreaDescriptionsStore = {

	data: {
		adIds: [],
		areaDescriptions: {},
		showSelection: true
	},

	dataLoader: CartoDBLoader,

	loadData: function (adIds) {

		this.data.adIds = adIds.map(adId => parseInt(adId));

		// create queries for those that aren't already in memory
		let queries = [];
		adIds.forEach(adId => {
			if (!this.data.areaDescriptions[adId]) {
				queries.push({
					query: 'SELECT holc_ads.city_id as ad_id, dir_name, holc_ads.year, holc_ads.state, holc_polygons.name, sheets, form_id, holc_id, holc_grade, polygon_id, cat_id, sub_cat_id, _order as order, data, ST_asgeojson (holc_polygons.the_geom, 4) as the_geojson, round(st_xmin(st_envelope(holc_polygons.the_geom))::numeric, 3) as bbxmin, round(st_ymin(st_envelope(holc_polygons.the_geom))::numeric, 3) as bbymin, round(st_xmax(st_envelope(holc_polygons.the_geom))::numeric, 3) as bbxmax, round(st_ymax(st_envelope(holc_polygons.the_geom))::numeric, 3) as bbymax, round(st_y(st_centroid(holc_polygons.the_geom))::numeric, 3) as centerlat, round(st_x(st_centroid(holc_polygons.the_geom))::numeric, 3) as centerlng, round((st_area(holc_polygons.the_geom::geography)/1000000 * 0.386102)::numeric, 3) as sqmi FROM holc_ad_data right join holc_polygons on holc_ad_data.polygon_id = holc_polygons.neighborhood_id join holc_ads on city_id = holc_polygons.ad_id where holc_ads.city_id =' + adId,
					format: 'JSON'
				});

				// add a query to associate neighborhoods with one or more maps if the maps for the ad overlap
				let mapIds = CitiesStore.getMapIds(adId),
					overlaps = mapIds.filter(mapId => RasterStore.getOverlappingMapIds().indexOf(mapId) != -1).length > 0;
				if (overlaps) {
					queries.push({
						query: 'with the_overlaps as (SELECT holc_polygons.the_geom as neighborhood_geom, holc_maps.the_geom as map_geom,  holc_maps.map_id, holc_id, holc_polygons.ad_id FROM holc_maps, holc_polygons, holc_maps_ads_join hmaj WHERE ST_intersects(holc_maps.the_geom, holc_polygons.the_geom)  and holc_polygons.ad_id = hmaj.ad_id and hmaj.map_id = holc_maps.map_id and holc_maps.map_id in (SELECT distinct(hm1.map_id) as overlapping_map_id FROM holc_maps AS hm1, holc_maps AS hm2 WHERE hm1.map_id <> hm2.map_id AND ST_Overlaps(hm1.the_geom, hm2.the_geom)) and holc_polygons.ad_id = ' + adId + '), counts as (select count(holc_id) as the_count, holc_id  from the_overlaps  group by holc_id) select ad_id, the_overlaps.holc_id, map_id, case when the_count > 1 then st_area(st_intersection(map_geom, neighborhood_geom)) / st_area(neighborhood_geom) else 1 end as area from the_overlaps join counts on the_overlaps.holc_id = counts.holc_id order by the_overlaps.holc_id, area desc',
						format: 'JSON'
					});
				}
			}
		});

		

		this.dataLoader.query(queries).then((responses) => {
			// separate the ad responses from the map_id responses
			let responsesADs = [],
				responsesMapIds = [];
			responses.forEach(response => {
				if (responses.length > 0 && response[0].state) {
					responsesADs.push(response);
				} else if (responses.length > 0 && response[0].map_id) {
					responsesMapIds.push(response);
				}
			});

			responsesADs.forEach(response => {
				if (response.length > 0) {
					let adId = response[0].ad_id;
					this.data.areaDescriptions[adId] = {
						formId: response[0].form_id,
						byNeighborhood: this.parseAreaDescriptions(response)
					};
					this.data.areaDescriptions[adId].byCategory = this.parseADsByCat(this.data.areaDescriptions[adId].byNeighborhood);
					this.data.areaDescriptions[adId].area = Object.keys(this.data.areaDescriptions[adId].byNeighborhood).map((HOLCId, i) => this.data.areaDescriptions[adId].byNeighborhood[HOLCId].sqmi ).reduce((a,b) => a+b, 0);
				}
			});

			responsesMapIds.forEach(response => {
				if (response.length > 0) {
					let adId = response[0].ad_id;
					response.forEach(neighborhoodData => {
						if (!this.data.areaDescriptions[adId].byNeighborhood[neighborhoodData.holc_id].mapIds) {
							this.data.areaDescriptions[adId].byNeighborhood[neighborhoodData.holc_id].mapIds = [neighborhoodData.map_id];
						} else {
							this.data.areaDescriptions[adId].byNeighborhood[neighborhoodData.holc_id].mapIds.push(neighborhoodData.map_id);
						}
					});
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
		const bucketUrl = 'http://holc.s3-website-us-east-1.amazonaws.com/';

		let adData = {};

		for(var row in rawAdData) {
			let d = rawAdData[row],
				urlPath = d.state + '/' + d.dir_name + '/' + d.year + '/',
				adImageUrl = bucketUrl + 'ads/' + urlPath + d.holc_id;

			// define id if undefined
			if(typeof adData[d.holc_id] == 'undefined') {
				adData[d.holc_id] = {};
			}
			// assign properties    
			adData[d.holc_id].area_geojson = (!adData[d.holc_id].area_geojson) ? JSON.parse(d.the_geojson) : adData[d.holc_id].area_geojson;
			adData[d.holc_id].area_geojson_inverted = (!adData[d.holc_id].area_geojson_inverted) ? this.parseInvertedGeoJson(JSON.parse(d.the_geojson)) : adData[d.holc_id].area_geojson_inverted;
			adData[d.holc_id].center = [d.centerlat,d.centerlng];
			adData[d.holc_id].boundingBox = [[d.bbymin,d.bbxmin],[d.bbymax,d.bbxmax]];
			adData[d.holc_id].name = d.name;
			adData[d.holc_id].holc_grade = d.holc_grade;
			adData[d.holc_id].sqmi = d.sqmi;

			adData[d.holc_id].url = bucketUrl + 'tiles/' + urlPath, + 'full-size/' + d.holc_id + '.jpg';
			adData[d.holc_id].tileUrl = adImageUrl + '/{z}/{x}_{y}.png';
			adData[d.holc_id].thumbnailUrl = adImageUrl  + '/thumbnail.jpg';
			adData[d.holc_id].bucketPath = bucketUrl + 'tiles/' + urlPath;

			adData[d.holc_id].sheets = d.sheets;

			// if there are multiple ad images, create those urls
			// if (d.sheets > 1) {
			// 	for (let page = 2; page <= d.sheets; page++) {
			// 		adData[d.holc_id].tileUrls.push(adImageUrl + '-' + page + '/{z}/{x}_{y}.png');
			// 		adData[d.holc_id].thumbnailUrls.push(adImageUrl + '-' + page + '/thumbnail.jpg');
			// 	}
			// }
			
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

	/* SETS */

	setShowSelection: function(showSelection) {
		if (showSelection !== this.data.showSelection) {
			this.data.showSelection = showSelection;
			this.emit(AppActionTypes.storeChanged);
		}
	},

	toggleView: function() { 
		this.data.showSelection = !this.data.showSelection; 
		this.emit(AppActionTypes.storeChanged);
	},

	/* GETS */

	getADs: function(adId) {return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].byNeighborhood : false; },

	getADsAsGeojson (adId) {
		let ADs = this.data.areaDescriptions[adId].byNeighborhood;
		let features = Object.keys(ADs).map((holcId) => { 
			let the_geojson = {
				type: "Feature",
				geometry: ADs[holcId].area_geojson,
				properties: {
					id: holcId,
					grade: ADs[holcId].holc_grade,
					name: ADs[holcId].name
				}
			}

			Object.keys(ADs[holcId].areaDesc).forEach(catNum => {
				if (typeof ADs[holcId].areaDesc[catNum] == 'string') {
					the_geojson.properties['ad' + catNum] = ADs[holcId].areaDesc[catNum];
				} else {
					Object.keys(ADs[holcId].areaDesc[catNum]).forEach(catLetter => {
						if (typeof ADs[holcId].areaDesc[catNum][catLetter] == 'string') {
							the_geojson.properties['ad' + catNum + catLetter] = ADs[holcId].areaDesc[catNum][catLetter];
						} else {
							Object.keys(ADs[holcId].areaDesc[catNum][catLetter]).forEach(subpart => {
								the_geojson.properties['ad' + catNum + catLetter + subpart] = ADs[holcId].areaDesc[catNum][catLetter][subpart];
							});
						}
					});
				}
			});

			return the_geojson;
		} );
		let geojson = {
			type: "FeatureCollection",
			features: features
		}

		return geojson;
	},

	getADsForCategory: function(adId, category) {
		if (!this.data.areaDescriptions[adId] || !category) {
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

	getADsForNeighborhood: function(adId, holcId) { return (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood[holcId]) ? this.data.areaDescriptions[adId].byNeighborhood[holcId].areaDesc : false; },


	getAdTileUrl: function(adId, HOLCId) { return (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood && this.data.areaDescriptions[adId].byNeighborhood[HOLCId]) ? this.data.areaDescriptions[adId].byNeighborhood[HOLCId].tileUrl : null; },

	getAdUrl: function(adId, HOLCId) { return (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood && this.data.areaDescriptions[adId].byNeighborhood[HOLCId]) ? this.data.areaDescriptions[adId].byNeighborhood[HOLCId].url : null; },

	getArea: function(adId) { return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].area : null; },

	getAreaDescriptions: function() { return this.data.areaDescriptions; },

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

	getFormId: function(adId) { return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].formId : null; },

	getGeoJsonForGrade: function(adId, grade) {
		let polygons = [[[0,0], [0, 90], [-180, 90], [-180, 0], [0,0]]],
			holes = [];
		Object.keys(this.data.areaDescriptions[adId].byNeighborhood).forEach((id, i) => {
			if (this.data.areaDescriptions[adId].byNeighborhood[id].holc_grade == grade) {
				this.data.areaDescriptions[adId].byNeighborhood[id].area_geojson.coordinates.forEach(coordset => {
					coordset.forEach((coords, i2) => {
						if (i2 == 0) {
							polygons.push(coords);
						} else {
							holes.push(coords);
						}
					});
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

	getName: function(adId, HOLCId) { return (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood[HOLCId]) ? this.data.areaDescriptions[adId].byNeighborhood[HOLCId].name : null; },

	getNeighborhoodBoundingBox: function (adId, holcId) { return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].byNeighborhood[holcId].boundingBox : null; },

	getNeighborhoodCenter: function (adId, holcId) { return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].byNeighborhood[holcId].center : null; },

	getNeighborhoodMapIds: function(adId, holcId) { return (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood[holcId]) ? this.data.areaDescriptions[adId].byNeighborhood[holcId].mapIds : [];}, 

	getNeighborhoodNames: function (adId) {
		let names = {};
		if (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood) {
			Object.keys(this.data.areaDescriptions[adId].byNeighborhood).forEach(holcId => {
				names[holcId] = this.getName(adId, holcId);
			});
		}
		return names;
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

	getNextHOLCId: function(adId, HOLCId) {
		if (this.data.areaDescriptions[adId]) {
			let formIds = Object.keys(this.data.areaDescriptions[adId].byNeighborhood).sort(this.alphanumCase);
			return formIds[formIds.indexOf(HOLCId) + 1];
		} else {
			return false;
		}
	},

	getPreviousCatIds: function(adId, catNum, catLetter) {
		if (!this.data.areaDescriptions[adId]) {
			return null;
		}

		const formId = this.data.areaDescriptions[adId].formId;
		for (let checkCatNum = (!catLetter || catLetter == 'a') ? parseInt(catNum) - 1 : parseInt(catNum); checkCatNum >= 1; checkCatNum--) {
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

	getPreviousHOLCId: function(adId, HOLCId) {
		if (this.data.areaDescriptions[adId]) {
			let formIds = Object.keys(this.data.areaDescriptions[adId].byNeighborhood).sort(this.alphanumCase);
			return formIds[formIds.indexOf(HOLCId) - 1];
		} else {
			return false;
		}
	},

	getSheets: function(adId, HOLCId) { return (this.data.areaDescriptions[adId]) ? parseInt(this.data.areaDescriptions[adId].byNeighborhood[HOLCId].sheets) : null; },

	getThumbnailUrl: function(adId, HOLCId) { return (this.data.areaDescriptions[adId] && this.data.areaDescriptions[adId].byNeighborhood && this.data.areaDescriptions[adId].byNeighborhood[HOLCId]) ? this.data.areaDescriptions[adId].byNeighborhood[HOLCId].thumbnailUrl : null; },

	getVisible: function() {
		let ADs = {};
		this.data.adIds.forEach(adId => {
			if (this.data.areaDescriptions[adId]) {
				ADs[adId] = this.data.areaDescriptions[adId].byNeighborhood;
			}
		});
		return ADs;
	},

	getVisibleMapIds: function() { return this.data.adIds; },

	hasLoaded: function () { return this.data.hasLoaded; },

	show: function () { return (this.data.showSelection) ? 'selection' : 'full' },

	overlapsMap: function(adId, HOLCId, mapId) {

	},

	/* alphanum.js (C) Brian Huisman * Based on the Alphanum Algorithm by David Koelle * The Alphanum Algorithm is discussed at http://www.DaveKoelle.com * * Distributed under same license as original * * This library is free software; you can redistribute it and/or * modify it under the terms of the GNU Lesser General Public * License as published by the Free Software Foundation; either * version 2.1 of the License, or any later version. * * This library is distributed in the hope that it will be useful, * but WITHOUT ANY WARRANTY; without even the implied warranty of * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU * Lesser General Public License for more details. * * You should have received a copy of the GNU Lesser General Public * License along with this library; if not, write to the Free Software * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA */ 
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
			if (action.hashState.adview == 'full') {
				AreaDescriptionsStore.setShowSelection(false);
			}

			// you have to wait for initial load of CitiesStore before you can use the slug to get the city if one's requested
			if (action.hashState.city) {
				const waitingCities = setInterval(() => {
					if (CitiesStore.hasLoaded() && RasterStore.hasLoaded()) {
						clearInterval(waitingCities);

						if (CitiesStore.getADIdFromSlug(action.hashState.city)) {
							AreaDescriptionsStore.loadData([CitiesStore.getADIdFromSlug(action.hashState.city)]);
						}
					}
				}, 10);
			}
			// no break as the following needs to execute;
		case AppActionTypes.loadInitialData:
		case AppActionTypes.mapMoved:
			AppDispatcher.waitFor([MapStateStore.dispatchToken]);

			const waitingMapState = setInterval(() => {
				if (MapStateStore.hasLoaded()) {
					clearInterval(waitingMapState);
					let visibleADIds = MapStateStore.getVisibleAdIds();

					if (visibleADIds && MapStateStore.isAboveZoomThreshold()) {
						AreaDescriptionsStore.loadData(visibleADIds);
					}
				}
			}, 10);


			break;

		case AppActionTypes.toggleADView:
			AreaDescriptionsStore.toggleView();
			break;


	}


	return true;

});


export default AreaDescriptionsStore;