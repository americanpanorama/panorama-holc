import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import formsMetadata from '../../data/formsMetadata.json';
import MapStateStore from '../stores/MapStateStore';
import stateAbbrs from '../../data/state_abbr.json';

const CitiesStore = {

	data: {
		cities: {},
		hasLoaded: false
	},

	dataLoader: CartoDBLoader,

	loadData: function () {

		this.dataLoader.query([
			{
				query: "WITH polygon_bounds as (select ad_id, st_xmin(st_envelope(st_collect(holc_polygons.the_geom))) as bbxmin, st_ymin(st_envelope(st_collect(holc_polygons.the_geom))) as bbymin, st_xmax(st_envelope(st_collect(holc_polygons.the_geom))) as bbxmax, st_ymax(st_envelope(st_collect(holc_polygons.the_geom))) as bbymax FROM holc_polygons group by ad_id), has_ads as (select count(data), ad_id from holc_ad_data join holc_polygons on holc_ad_data.polygon_id = holc_polygons.neighborhood_id group by ad_id) SELECT holc_ads.city_id as ad_id, city, state, looplat::numeric, looplng::numeric, form_id, total_pop_1940, total_pop_1930, american_indian_eskimo_1930, american_indian_eskimo_1940, asian_pacific_1930 as asian_pacific_islander_1930, asian_pacific_1940 as asian_pacific_1940, black_pop_1930, black_pop_1940, white_pop_1930, white_pop_1940, fb_30, fb30_afr_amer, fb30_all_other, fb30_chinese, fb30_indian, fb30_japanese, fb30_other_races, fb30_white, native_pop_1930, fb_40, fb40_afr_amer, fb40_all_other, fb40_chinese, fb40_indian, fb40_japanese, fb40_other_races, fb40_white, native_pop_1940, images, case when has_ads.ad_id is not null then true else false end as has_ads, sum(st_area(holc_polygons.the_geom_webmercator)) / 1609.34^2 as total_area, sum(CASE WHEN holc_grade = 'A' THEN st_area(holc_polygons.the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_a, sum(CASE WHEN holc_grade = 'B' THEN st_area(holc_polygons.the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_b, sum(CASE WHEN holc_grade = 'C' THEN st_area(holc_polygons.the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_c, sum(CASE WHEN holc_grade = 'D' THEN st_area(holc_polygons.the_geom_webmercator) ELSE 0 END) / 1609.34^2 as area_d, bbxmin, bbymin, bbxmax, bbymax, array_agg(distinct map_id) as map_ids FROM holc_polygons right join holc_ads on holc_polygons.ad_id = holc_ads.city_id left join polygon_bounds on holc_ads.city_id = polygon_bounds.ad_id join holc_maps_ads_join on holc_maps_ads_join.ad_id = holc_ads.city_id left join has_ads on has_ads.ad_id = holc_ads.city_id group by holc_ads.city_id, city, state, form_id, looplat, looplng, total_pop_1940, total_pop_1930, american_indian_eskimo_1930, american_indian_eskimo_1940, asian_pacific_1930, asian_pacific_1940, black_pop_1930, black_pop_1940, white_pop_1930, white_pop_1940, fb_30, fb30_afr_amer, fb30_all_other, fb30_chinese, fb30_indian, fb30_japanese, fb30_other_races, fb30_white, native_pop_1930, fb_40, fb40_afr_amer, fb40_all_other, fb40_chinese, fb40_indian, fb40_japanese, fb40_other_races, fb40_white, native_pop_1940, images, has_ads, bbxmin, bbymin, bbxmax, bbymax  order by state, city",
				format: 'JSON'
			}
		]).then((responses) => {
			responses.forEach(response => {
				if (response.length > 0) {
					responses[0].forEach(response => {
						this.data.cities[response.ad_id] = {
							ad_id: response.ad_id,
							state: response.state,
							name: response.city,
							searchName: response.city + ', ' + stateAbbrs[response.state],
							slug: response.city.toLowerCase().replace(/ +/g,'-') + '-' + response.state.toLowerCase(), 
							form_id: response.form_id,
							centerLat: response.looplat,
							centerLng: response.looplng,
							bounds: (response.bbymin && response.bbxmin && response.bbymax && response.bbxmax) ? [[response.bbymin, response.bbxmin], [response.bbymax, response.bbxmax]] : null,
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
							hasPolygons: (response.total_area !== null),
							area : {
								total: response.total_area,
								a: response.area_a,
								b: response.area_b,
								c: response.area_c,
								d: response.area_d
							},
							maps: [],
							mapIds: response.map_ids
						}

						this.data.cities[response.ad_id].radii = (response.total_area) ? this.calculateSimpleRingsRadii(this.data.cities[response.ad_id].area) : null;

						this.data.cities[response.ad_id].displayPop = this.parsePopSnippetDisplayData(this.data.cities[response.ad_id].population);
					});

					this.data.hasLoaded = true;

					this.emit(AppActionTypes.storeChanged);
				}
			});



		}, (error) => {
			// TODO: handle this.
			console.log('CitiesStore received error:', error);
			throw error;
		});
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

	getAdIdsFromMapId(mapId) { return (this.data.cities) ? Object.keys(this.data.cities).filter(adId => this.data.cities[adId].mapIds.indexOf(mapId) != -1).map(adId => parseInt(adId)) : [] },

	getADIdFromSlug(slug) { return (this.data.cities) ? Object.keys(this.data.cities).filter(adId => (this.data.cities[adId].slug == slug))[0] : null; },

	getADsList: function() { return Object.keys(this.data.cities).map((adId) => this.data.cities[adId]); },

	getCenterPoint: function(adId) { return (this.data.cities[adId]) ? [ this.data.cities[adId].centerLat, this.data.cities[adId].centerLng] : null },

	getCitiesMetadata: function() { return this.data.cities; },

	getCityName: function(adId) { return (this.data.cities[adId]) ? this.data.cities[adId].name : null },

	getDisplayPopStats: function(adId) { return (this.data.cities[adId]) ? this.data.cities[adId].displayPop : null },

	getFormId: function(adId) { return (this.data.cities[adId]) ? this.data.cities[adId].form_id : null; },

	getFullCityMetadata: function(adId) { return this.data.cities[adId]; },

	getMapIds: function(adId) { return (this.data.cities[adId]) ? this.data.cities[adId].mapIds : []; },

	getMaps: function(adId) { return (this.data.cities[adId]) ? this.data.cities[adId].maps : []; },

	getSlug: function(adId) { return (this.data.cities[adId]) ? this.data.cities[adId].slug : null; },

	getState: function(adId) { return (this.data.cities[adId]) ? this.data.cities[adId].state : null }, 

	getYear: function(adId) { return (this.data.cities[adId]) ? this.data.cities[adId].year : null },

	hasLoaded: function () { return this.data.hasLoaded; },

	hasADData: function(adId) { return (this.data.cities[adId] && this.data.cities[adId].hasADs); },

	hasADImages: function(adId) { return (this.data.cities [adId] && this.data.cities[adId].hasImages); }

};


// Mixin EventEmitter functionality
Object.assign(CitiesStore, EventEmitter.prototype);


// Register callback to handle all updates
AppDispatcher.register((action) => {

	switch (action.type) {
		case AppActionTypes.loadInitialData:
			CitiesStore.loadData();
			break;
	}
	
	return true;

});


export default CitiesStore;