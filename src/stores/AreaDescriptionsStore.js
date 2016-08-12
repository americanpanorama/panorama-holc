import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import formsMetadata from '../../data/formsMetadata.json';
import MapStateStore from '../stores/MapStateStore';
import stateAbbrs from '../../data/state_abbr.json';


const AreaDescriptionsStore = {

	data: {
		adIds: [],
		areaDescriptions: {},
		adsMetadata: {},
		hasLoaded: false
	},

	dataLoader: CartoDBLoader,

	loadADMetadata: function () {

		this.dataLoader.query([
			{
				query: "WITH polygon_bounds as (select ad_id, st_xmin(st_envelope(st_collect(holc_polygons.the_geom))) as bbxmin, st_ymin(st_envelope(st_collect(holc_polygons.the_geom))) as bbymin, st_xmax(st_envelope(st_collect(holc_polygons.the_geom))) as bbxmax, st_ymax(st_envelope(st_collect(holc_polygons.the_geom))) as bbymax FROM holc_polygons group by ad_id), has_ads as (select count(data), ad_id from holc_ad_data join holc_polygons on holc_ad_data.polygon_id = holc_polygons.neighborhood_id group by ad_id)SELECT holc_polygons.ad_id, city, state, looplat, looplng, total_pop_1940, total_pop_1930, american_indian_eskimo_1930, american_indian_eskimo_1940, asian_pacific_1930 as asian_pacific_islander_1930, asian_pacific_1940 as asian_pacific_1940, black_pop_1930, black_pop_1940, white_pop_1930, white_pop_1940, fb_30, fb30_afr_amer, fb30_all_other, fb30_chinese, fb30_indian, fb30_japanese, fb30_other_races, fb30_white, native_pop_1930, fb_40, fb40_afr_amer, fb40_all_other, fb40_chinese, fb40_indian, fb40_japanese, fb40_other_races, fb40_white, native_pop_1940, images, case when has_ads.ad_id is not null then true else false end as has_ads, sum(st_area(holc_polygons.the_geom_webmercator)) / 1609.34^2 as total_area, sum(CASE WHEN holc_grade = 'A' THEN st_area(holc_polygons.the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_a, sum(CASE WHEN holc_grade = 'B' THEN st_area(holc_polygons.the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_b, sum(CASE WHEN holc_grade = 'C' THEN st_area(holc_polygons.the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_c, sum(CASE WHEN holc_grade = 'D' THEN st_area(holc_polygons.the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_d, bbxmin, bbymin, bbxmax, bbymax FROM holc_polygons join holc_ads on holc_polygons.ad_id = holc_ads.city_id join polygon_bounds on holc_ads.city_id = polygon_bounds.ad_id left join has_ads on has_ads.ad_id = holc_ads.city_id group by holc_polygons.ad_id, city, state, looplat, looplng, total_pop_1940, total_pop_1930, american_indian_eskimo_1930, american_indian_eskimo_1940, asian_pacific_1930, asian_pacific_1940, black_pop_1930, black_pop_1940, white_pop_1930, white_pop_1940, fb_30, fb30_afr_amer, fb30_all_other, fb30_chinese, fb30_indian, fb30_japanese, fb30_other_races, fb30_white, native_pop_1930, fb_40, fb40_afr_amer, fb40_all_other, fb40_chinese, fb40_indian, fb40_japanese, fb40_other_races, fb40_white, native_pop_1940, images, has_ads, bbxmin, bbymin, bbxmax, bbymax  order by ad_id desc",
				format: 'JSON'
			}
		]).then((responses) => {
			responses.forEach(response => {
				if (response.length > 0) {
					responses[0].forEach(response => {
						this.data.adsMetadata[response.ad_id] = {
							ad_id: response.ad_id,
							state: response.state,
							name: response.city,
							searchName: response.city + ', ' + stateAbbrs[response.state],
							centerLat: response.looplat,
							centerLng: response.looplng,
							bounds: [[response.bbymin, response.bbxmin], [response.bbymax, response.bbxmax]],
							hasImages: response.images,
							hasADs: response.has_ads,


							population:  {
								1930: {
									total: response.total_pop_1930,

									AfricanAmerican: response.black_pop_1930,
									asianAmerican: response.asian_pacific_1930,
									nativeAmerican: response.american_indian_eskimo_1930,
									other: response.other_1930,
									white: response.white_pop_1930,

									fb: response.fb_30,
									fb_percent: response.fb30_percent,
									fb_AfricanAmerican: response.fb30_afr_amer,
									fb_allOther: response.fb30_all_other,
									fb_Chinese: response.fb30_chinese,
									fb_Indian: response.fb30_indian,
									fb_Japanese: response.fb30_japanese,

									fb_otherRaces: response.fb30_other_races,
									fb_white: response.fb30_white,
									native: response.native_pop_1930
								},
								1940: {
									total: response.total_pop_1940,

									AfricanAmerican: response.black_pop_1940,
									asianAmerican: response.asian_pacific_1940,
									nativeAmerican: response.american_indian_eskimo_1940,
									other: response.other_1940,
									white: response.white_pop_1940,

									fb: response.fb_40,
									fb_percent: response.fb40_percent,
									fb_AfricanAmerican: response.fb40_afr_amer,
									fb_allOther: response.fb40_all_other,
									fb_Chinese: response.fb40_chinese,
									fb_Indian: response.fb40_indian,
									fb_Japanese: response.fb40_japanese,

									fb_otherRaces: response.fb40_other_races,
									fb_white: response.fb40_white,
									native: response.native_pop_1940
								}
							},
							population_1930: response.total_pop_1930,
							population_1940: response.total_pop_1940,
							american_indian_eskimo_1930: response.american_indian_eskimo_1930,
							american_indian_eskimo_1940: response.american_indian_eskimo_1940,
							asian_pacific_islander_1930: response.asian_pacific_islander_1930,
							asian_pacific_islander_1940: response.asian_pacific_islander_1940,
							black_pop_1930: response.black_pop_1930,
							black_pop_1940: response.black_pop_1940,
							white_pop_1930: response.white_pop_1930,
							white_pop_1940: response.white_pop_1940,
							hasPolygons: true,
							area : {
								total: response.total_area,
								a: response.area_a,
								b: response.area_b,
								c: response.area_c,
								d: response.area_d
							},
							maps: []
						}

						this.data.adsMetadata[response.ad_id].radii = this.calculateSimpleRingsRadii(this.data.adsMetadata[response.ad_id].area);

						this.data.adsMetadata[response.ad_id].displayPop = this.parsePopSnippetDisplayData(this.data.adsMetadata[response.ad_id].population);
					});

					// get the map_ids 
					this.dataLoader.query([
						{
							query: 'select ad_id, holc_maps.map_id, name from holc_maps_ads_join join holc_maps on holc_maps.map_id = holc_maps_ads_join.map_id',
							format: 'JSON'
						}
					]).then((responses) => {
						responses[0].forEach(response => {
							if (this.data.adsMetadata[response.ad_id]) {
								this.data.adsMetadata[response.ad_id].maps.push({
									id: response.map_id,
									name: response.name
								});
							}
						});

						this.data.hasLoaded = true;

						this.emit(AppActionTypes.storeChanged);
					});
				}
			});



		}, (error) => {
			// TODO: handle this.
			console.log('AreaDescriptionsStore received error:', error);
			throw error;
		});
	},

	loadData: function (adIds) {

		this.data.adIds = adIds.map(adId => parseInt(adId));

		// create queries for those that aren't already in memory
		let queries = [];
		adIds.forEach(adId => {
			if (!this.data.areaDescriptions[adId]) {
				queries.push({
					query: 'SELECT holc_ads.city_id as ad_id, holc_maps.file_name, holc_ads.year, holc_ads.state, holc_polygons.name, sheets, form_id, holc_id, holc_grade, polygon_id, cat_id, sub_cat_id, _order as order, data, ST_asgeojson (holc_polygons.the_geom, 4) as the_geojson, st_xmin(st_envelope(holc_polygons.the_geom)) as bbxmin, st_ymin(st_envelope(holc_polygons.the_geom)) as bbymin, st_xmax(st_envelope(holc_polygons.the_geom)) as bbxmax, st_ymax(st_envelope(holc_polygons.the_geom)) as bbymax, st_y(st_centroid(holc_polygons.the_geom)) as centerlat, st_x(st_centroid(holc_polygons.the_geom)) as centerlng, st_area(holc_polygons.the_geom::geography)/1000000 * 0.386102 as sqmi FROM holc_ad_data right join holc_polygons on holc_ad_data.polygon_id = holc_polygons.neighborhood_id join holc_ads on city_id = holc_polygons.ad_id join holc_maps_ads_join on holc_maps_ads_join.ad_id = city_id join holc_maps on holc_maps.map_id = holc_maps_ads_join.map_id and parent_id is null where holc_ads.city_id = ' + adId,
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
		const bucketUrl = 'http://holc.s3-website-us-east-1.amazonaws.com/';

		let adData = {};

		for(var row in rawAdData) {
			let d = rawAdData[row],
				urlPath = d.state + '/' + d.file_name.replace(/\s+/g, '')  + '/' + d.year + '/',
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

	calculateSimpleRingsRadii: function (areaData) {
		let furthestRadius = 25000,
			fullArea = Math.PI * furthestRadius * furthestRadius,
			outerRadius,
			innerRadius = 0,
			donutArea,
			gradeArea,
			radii = {};

		['d','c','b','a'].forEach((grade) => {
			let donutholeArea = Math.PI * innerRadius * innerRadius,
				gradeArea = fullArea * (areaData[grade] / areaData.total),
				outerRadius = Math.round(Math.sqrt((gradeArea + donutholeArea) / Math.PI));
			radii[grade] = {
				'inner': innerRadius,
				'outer': outerRadius
			};
			innerRadius = outerRadius;
		});

		return radii;
	},

	parsePopSnippetDisplayData: function(popStats) {
		let displayPop = {
			1930: this.parsePopSnippetDisplayDataDecade(popStats[1930]),
			1940: this.parsePopSnippetDisplayDataDecade(popStats[1940])
		};

		displayPop[1930].percents = displayPop[1930].percents.filter(pop30 => {
			let pop40 = displayPop[1940].percents.filter(pop40temp => (pop30.label == pop40temp.label));
			if (pop40.length == 0 && pop30.proportion >= 0.005) {
				displayPop[1940].percents.push({
					label: pop30.label,
					proportion: null 
				});
			}
			return (pop30.proportion >= 0.005);
		});

		displayPop[1940].percents = displayPop[1940].percents.filter(pop40 => {
			let pop30 = displayPop[1930].percents.filter(pop30temp => (pop30temp.label == pop40.label));
			if (pop30.length == 0 && pop40.proportion >= 0.005) {
				displayPop[1930].percents.push({
					label: pop40.label,
					proportion: null
				});
			}
			return (pop40.proportion >= 0.005);
		});

		displayPop[1940].percents.sort((a,b) => a.proportion < b.proportion);
		displayPop.order = displayPop[1940].percents.map(pop40 => pop40.label);

		return displayPop;
	},

	parsePopSnippetDisplayDataDecade: function(popStatsDecade) {
		let displayData = { total: popStatsDecade.total, percents: [] };

		// if there's data for foreign-born & native-born whites, use that
		if (popStatsDecade.fb_white && popStatsDecade.white) {
			displayData.percents.push( {
				label: 'Native-born white',
				proportion: (popStatsDecade.white - popStatsDecade.fb_white) / popStatsDecade.total 
			});
			displayData.percents.push( {
				label: 'Foreign-born white',
				proportion: popStatsDecade.fb_white / popStatsDecade.total 
			});
		} else if (popStatsDecade.white) {
			displayData.percents.push( {
				label: 'white',
				proportion: popStatsDecade.white / popStatsDecade.total 
			});
		}

		if (popStatsDecade.AfricanAmerican) {
			displayData.percents.push( {
				label: 'African American',
				proportion: popStatsDecade.AfricanAmerican / popStatsDecade.total 
			});
		}

		if (popStatsDecade.asianAmerican) {
			displayData.percents.push( {
				label: 'Asian American',
				proportion: popStatsDecade.asianAmerican / popStatsDecade.total 
			});
		}

		if (popStatsDecade.nativeAmerican) {
			displayData.percents.push( {
				label: 'Native American',
				proportion: popStatsDecade.nativeAmerican / popStatsDecade.total 
			});
		}

		if (popStatsDecade.fb_Chinese) {
			displayData.percents.push( {
				label: 'Foreign-born Chinese',
				proportion: popStatsDecade.fb_Chinese / popStatsDecade.total 
			});
		}

		if (popStatsDecade.fb_Japanese) {
			displayData.percents.push( {
				label: 'Foreign-born Japanese',
				proportion: popStatsDecade.fb_Japanese / popStatsDecade.total 
			});
		}

		if (popStatsDecade.fb_AfricanAmerican) {
			displayData.percents.push( {
				label: 'Foreign-born African American',
				proportion: popStatsDecade.fb_AfricanAmerican / popStatsDecade.total 
			});
		}

		return displayData;
	},

	/* GETS */

	getADs: function(adId) {
		return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].byNeighborhood : false;
	},

	getADsAsGeojson (adId) {
		console.log(adId);
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

		console.log(geojson);

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

	// return a flat list of the HOLC maps for rendering
	getADsList: function() { return Object.keys(this.data.adsMetadata).map((adId) => this.data.adsMetadata[adId]); },

	getADsMetadata: function() { return this.data.adsMetadata; },

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

	getDisplayPopStats: function(adId) { return (this.data.adsMetadata[adId]) ? this.data.adsMetadata[adId].displayPop : null },

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

	getMaps: function(adId) { return (this.data.adsMetadata[adId]) ? this.data.adsMetadata[adId].maps : []; },

	getNeighborhoodBoundingBox: function (adId, holcId) { return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].byNeighborhood[holcId].boundingBox : null; },

	getNeighborhoodCenter: function (adId, holcId) { return (this.data.areaDescriptions[adId]) ? this.data.areaDescriptions[adId].byNeighborhood[holcId].center : null; },

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

	hasADData: function(adId) { return (this.data.adsMetadata[adId] && this.data.adsMetadata[adId].hasADs); },

	hasADImages: function(adId) { return (this.data.adsMetadata [adId] && this.data.adsMetadata[adId].hasImages); },

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
			AppDispatcher.waitFor([MapStateStore.dispatchToken]);
			AreaDescriptionsStore.loadADMetadata();
			if (action.state.selectedCity) {
				AreaDescriptionsStore.loadData([action.state.selectedCity]);
			}
			break;

		case AppActionTypes.mapMoved:
			AppDispatcher.waitFor([MapStateStore.dispatchToken]);

			let visibleHOLCMapsIds = MapStateStore.getVisibleHOLCMapsIds(),
				visibleADIds = MapStateStore.getVisibleAdIds();

			if (visibleADIds && MapStateStore.isAboveZoomThreshold()) {
				AreaDescriptionsStore.loadData(visibleADIds);
			}
			break;
	}


	return true;

});


export default AreaDescriptionsStore;