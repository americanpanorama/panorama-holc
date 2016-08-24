import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import formsMetadata from '../../data/formsMetadata.json';
import MapStateStore from '../stores/MapStateStore';

/* City Store is responsible for maintaining most of the important state
variables: e.g. selected city, neighborhood, category, ring, grade, etc. */
const CityStore = {

	data: {
		id: null,
		name: null,
		state: null,
		year: null,
		selectedRingGrade: {
			ringId: -1,
			grade: null
		},
		selectedHolcId: null,
		selectedCategory: null,
		selectedGrade: null,
		highlightedHolcId: null,
		areas: {},
		ringAreasGeometry: [], // not the rings themselves but the intersection of rings and areas
		loopLatLng: [],
		// the distance in meters between the loop center and the outermost point
		outerRingRadius: null,
		population: {
			1930: {
				total: null,

				AfricanAmerican: null,
				asianAmerican: null,
				nativeAmerican: null,
				other: null,
				white: null,

				fb: null,
				fb_percent: null,
				fb_AfricanAmerican: null,
				fb_allOther: null,
				fb_Chinese: null,
				fb_Indian: null,
				fb_Japanese: null,

				fb_otherRaces: null,
				fb_white: null,
				native_white: null
			},
			1940: {
				total: null,

				AfricanAmerican: null,
				asianAmerican: null,
				nativeAmerican: null,
				other: null,
				white: null,

				fb: null,
				fb_percent: null,
				fb_AfricanAmerican: null,
				fb_allOther: null,
				fb_Chinese: null,
				fb_Indian: null,
				fb_Japanese: null,

				fb_otherRaces: null,
				fb_white: null,
				native_white: null
			}
		},
		cityData: {},

		/** Percentages of each ring for each grade, with 
		 * density recording the amount of neighborhood area 
		 * in the ring.
		 * {
		 *   1: {
		 *     'A': float,
		 *     'B': float,
		 *     'C': float,
		 *     'D': float,
		 *     'density': float,
		 *   },
		 *   2: { ... },
		 *   ...
		 }
		 * }
		 */
		ringStats: [],
		gradeStats: [],

		ADsByCat: {},
		polygonBoundingBox: null,
		polygonsCenter: null,
		gradedArea: null,
		gradedAreaOfRings: {},
		gradedAreaByGrade: {},
		users: {
			latLng: null,
			adId: null,
			city: null,
			neighborhood: null,
			offerZoomTo: false
		},
		selectedByUser: false,
		hasLoaded: false,
		bucketPath: null
	},

	cache: {},

	// TODO: Make a generic DataLoader class to define an interface,
	// and let CartoDBLoader extend and implement that?
	// Basic idea is that anything with a query method that returns a Promise
	// that resolves with an array of response data or rejects with an error
	// can be used here.
	dataLoader: CartoDBLoader,

	loadData: function (cityId, selectedByUser) {
		if (cityId == null) {
			this.data.id = null;
			this.data.selectedHolcId = null;
			this.data.selectedCategory = null;
			this.emit(AppActionTypes.storeChanged);
			return;
		}

		if (cityId == this.data.id) {
			// already loaded;
			this.emit(AppActionTypes.storeChanged);
			return;
		}

		// // check to see if the city data has already been loaded and stored in cache
		// if (this.cache[cityId]) {
		// 	console.log(this.cache);
		// 	this.data = this.cache[cityId];
		// 	console.log(this.data);
		// 	this.emit(AppActionTypes.storeChanged);
		// 	return;
		// }

		this.dataLoader.query([
			{
				query: 'SELECT * from holc_ads where city_id = ' + cityId,
				format: 'JSON'
			},
			// get ring polygons
			{
				query: 'WITH the_hull as (select ST_Collect(digitalscholarshiplab.holc_polygons.the_geom_webmercator) as hull, ad_id FROM digitalscholarshiplab.holc_polygons where ad_id = ' + cityId + ' GROUP BY ad_id), maxdist as (SELECT st_distance_sphere(st_transform(st_endpoint(st_longestline(st_transform(ST_SetSRID(ST_MakePoint(looplng,looplat),4326),3857), hull)), 4326), ST_SetSRID(ST_MakePoint(looplng,looplat), 4326)) as outerringradius, st_length(st_longestline(st_transform(ST_SetSRID(ST_Point(looplng,looplat),4326),3857), hull)) / 3.5 as distintv, ST_Transform(ST_SetSRID(ST_MakePoint(looplng,looplat),4326),3857)::geometry as the_point from the_hull join holc_ads on the_hull.ad_id = holc_ads.city_id and holc_ads.city_id = ' + cityId + ' Order by distintv DESC Limit 1 ), city_buffers as (SELECT ST_Transform((ST_Buffer(the_point,distintv * 3.5,\'quad_segs=32\')::geometry),3857) as buffer4, ST_Transform((ST_Buffer(the_point,distintv * 2.5,\'quad_segs=32\')::geometry),3857) as buffer3, ST_Transform((ST_Buffer(the_point,distintv * 1.5,\'quad_segs=32\')::geometry),3857) as buffer2, ST_Transform((ST_Buffer(the_point,distintv * 0.5,\'quad_segs=32\')::geometry),3857) as buffer1 FROM maxdist), city_rings as (SELECT ST_Difference(buffer4, buffer3) as the_geom_webmercator, 4 as ring_id, st_area(ST_Difference(buffer4, buffer3)) as ring_area from city_buffers union all select ST_Difference(buffer3, buffer2) as the_geom_webmercator, 3 as ring_id, st_area(ST_Difference(buffer3, buffer2)) as ring_area from city_buffers union all select ST_Difference(buffer2, buffer1) as the_geom_webmercator, 2 as ring_id, st_area(ST_Difference(buffer2, buffer1)) as ring_area from city_buffers union all select buffer1 as the_webmercator, 1 as ring_id, st_area(buffer1) as ring_area from city_buffers ), combined_grades as (SELECT holc_grade, ST_union(the_geom_webmercator) as the_geom_webmercator FROM digitalscholarshiplab.holc_polygons where ad_id = ' + cityId + ' group by holc_grade) SELECT holc_grade as grade, ring_id as ring, ST_AsGeoJSON(ST_Transform(ST_Intersection(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator),4326), 4) as the_geojson, ST_AsGeoJSON(ST_Transform(ST_Difference(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator),4326), 4) as inverted_geojson, st_area(ST_Intersection(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator)) as area, ST_Area(city_rings.the_geom_webmercator) as ring_area, outerringradius FROM city_rings, combined_grades, maxdist',
				format: 'JSON'
			},
			{
				query: 'Select st_x(st_centroid(ST_SetSRID(st_extent(the_geom),4326))) as centerLng, st_y(st_centroid(ST_SetSRID(st_extent(the_geom),4326))) as centerLat, st_xmin(ST_SetSRID(st_extent(the_geom),4326)) as minlng, st_ymin(ST_SetSRID(st_extent(the_geom),4326)) as minlat, st_xmax(ST_SetSRID(st_extent(the_geom),4326)) as maxlng, st_ymax(ST_SetSRID(st_extent(the_geom),4326)) as maxlat from digitalscholarshiplab.holc_polygons where ad_id = ' + cityId,
				format: 'JSON'
			}
		]).then((response) => {
			this.data.id = parseInt(cityId);
			this.data.selectedByUser = selectedByUser;

			let cityData = response[0][0];
			this.data.name = cityData.city;
			this.data.state = cityData.state;
			this.data.year = cityData.year;
			this.data.form_id = cityData.form_id;
			this.data.cityData = cityData;
			this.data.bucketPath = 'http://holc.s3-website-us-east-1.amazonaws.com/tiles/' + cityData.state + '/' + cityData.city.replace(/\s+/g, '')  + '/' + cityData.year + '/';

			this.data.population =  {
				1930: {
					total: cityData.total_pop_1930,

					AfricanAmerican: cityData.black_pop_1930,
					asianAmerican: cityData.asian_pacific_1930,
					nativeAmerican: cityData.american_indian_eskimo_1930,
					other: cityData.other_1930,
					white: cityData.white_pop_1930,

					fb: cityData.fb30,
					fb_percent: cityData.fb30_percent,
					fb_AfricanAmerican: cityData.fb30_afr_amer,
					fb_allOther: cityData.fb30_all_other,
					fb_Chinese: cityData.fb30_chinese,
					fb_Indian: cityData.fb30_indian,
					fb_Japanese: cityData.fb30_japanese,

					fb_otherRaces: cityData.fb30_other_races,
					fb_white: cityData.fb30_white,
					native_white: cityData.native_pop_1930
				},
				1940: {
					total: cityData.total_pop_1940,

					AfricanAmerican: cityData.black_pop_1940,
					asianAmerican: cityData.asian_pacific_1940,
					nativeAmerican: cityData.american_indian_eskimo_1940,
					other: cityData.other_1940,
					white: cityData.white_pop_1940,

					fb: cityData.fb40,
					fb_percent: cityData.fb40_percent,
					fb_AfricanAmerican: cityData.fb40_afr_amer,
					fb_allOther: cityData.fb40_all_other,
					fb_Chinese: cityData.fb40_chinese,
					fb_Indian: cityData.fb40_indian,
					fb_Japanese: cityData.fb40_japanese,

					fb_otherRaces: cityData.fb40_other_races,
					fb_white: cityData.fb40_white,
					native_white: cityData.native_pop_1940
				}
			};

			const ringData = response[1];
			this.data.gradedArea = this.calculatedGradedArea(ringData);
			this.data.gradedAreaOfRings = this.calculateGradedAreaOfRings(ringData);
			this.data.gradedAreaByGrade = this.calculateGradedAreaByGrade(ringData);
			this.data.ringAreasGeometry = this.parseRingAreaGeometry(ringData);
			this.data.ringStats = this.parseRingStats(this.data.ringAreasGeometry);
			this.data.outerRingRadius = (response[1][0]) ? response[1][0].outerringradius : false;
			this.data.loopLatLng = (cityData) ? [cityData.looplat, cityData.looplng] : false;
			this.data.gradeStats = this.parseGradeStats(this.data.ringAreasGeometry);
			
			let polygonLatLngs = response[2][0];
			if (polygonLatLngs.minlat) {
				this.data.polygonBoundingBox = [ [polygonLatLngs.minlat, polygonLatLngs.minlng], [polygonLatLngs.maxlat, polygonLatLngs.maxlng] ];
				this.data.polygonsCenter = [ polygonLatLngs.centerlat, polygonLatLngs.centerlng ];
			} else {
				this.data.polygonBoundingBox = null;
				this.data.polygonsCenter = null;
			}

			this.data.hasLoaded = true;

			// console.log('CityStore finished loading');
			// console.log(this.data);

			this.emit(AppActionTypes.storeChanged);

		}, (error) => {
			// TODO: handle this.
			console.log('CityStore received error:', error);
			throw error;
		});
	},

	/* setter functions for state variable */

	setHighlightedHolcId: function (holcId) {
		this.data.highlightedHolcId = holcId;
		this.emit(AppActionTypes.storeChanged);
	},

	setSelectedCategory: function (id) {
		this.data.selectedCategory = id;
		this.emit(AppActionTypes.storeChanged);
	},

	setSelectedHolcId: function (holcId) {
		this.data.selectedHolcId = holcId;
		this.emit(AppActionTypes.storeChanged);
	},

	setSelectedGrade: function (grade) {
		this.data.selectedGrade = grade;
		this.emit(AppActionTypes.storeChanged);
	},

	setSelectedRingGrade: function (selectedRingGrade) {
		this.data.selectedRingGrade = selectedRingGrade;
		this.emit(AppActionTypes.storeChanged);
	},

	/* getter functions */

	getBucketPath: function() { return this.data.bucketPath },

	getCityFromPoint: function(point) {
		let adId;
		this.dataLoader.query([
			{
				query: 'SELECT ad_id, city, ST_distance(ST_setsrid(ST_MakePoint(holc_maps.looplng, holc_maps.looplat),4326), ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326)) as distance, st_xmin( st_envelope(st_collect(ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326), holc_maps.the_geom))) as bbxmin, st_xmax( st_envelope(st_collect(ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326), holc_maps.the_geom))) as bbxmax, st_ymin( st_envelope(st_collect(ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326), holc_maps.the_geom))) as bbymin, st_ymax( st_envelope(st_collect(ST_setsrid(ST_MakePoint(' + point[1] +', ' + point[0] + '),4326), holc_maps.the_geom))) as bbymax from holc_maps join holc_maps_ads_join on holc_maps.map_id = holc_maps_ads_join.map_id join holc_ads on holc_ads.city_id = holc_maps_ads_join.ad_id order by distance limit 1',
				format: 'JSON'
			}
		]).then((response) => {
			this.data.users.city = response[0][0].city;
			this.data.users.adId = response[0][0].ad_id;

			this.emit(AppActionTypes.userLocated);
		}, (error) => {
			// TODO: handle this.
			console.log('Location received error:', error);
			throw error;
		});
	},

	getHighlightedHolcId: function() { return this.data.highlightedHolcId; },

	getId: function() {
		return this.data.id;
	},

	getSelectedCategory: function() {
		return this.data.selectedCategory;
	},

	getSelectedHolcId: function() {
		return this.data.selectedHolcId;
	},

	getSelectedGrade: function() {
		return this.data.selectedGrade;
	},

	getSelectedRingGrade: function() {
		return this.data.selectedRingGrade;
	},

	getName: function() {
		return this.data.name;
	},

	getState: function() {
		return this.data.state;
	},

	getFormId: function() {
		return this.data.form_id;
	},

	getRingStats: function() {
		return this.data.ringStats;
	},

	getRingAreasGeometry: function() {
		return this.data.ringAreasGeometry;
	},

	getGradeStats: function() {
		return this.data.gradeStats;
	},

	getCityData: function() {
		return this.data.cityData;
	},

	getSelectedGrade: function() {
		return this.data.selectedGrade;
	},

	getGeoJsonForSelectedRingArea: function(ring, grade) {
		return this.data.ringAreasGeometry[ring][grade].the_geojson;
	},

	getInvertedGeoJsonForSelectedRingArea: function(ring, grade) {
		return this.data.ringAreasGeometry[ring][grade].inverted_geojson;
	},

	getOuterRingRadius: function() {
		return this.data.outerRingRadius;
	},

	getLoopLatLng: function() {
		return this.data.loopLatLng;
	},

	getPolygonsBounds: function() {
		return this.data.polygonBoundingBox;
	},

	getPolygonsCenter: function() {
		return this.data.polygonsCenter;
	},

	getSelectedByUser: function() {
		return this.data.selectedByUser;
	},

	getUsersCity: function() {
		return this.data.users.city;
	},

	getUsersAdId: function() {
		return this.data.users.adId;
	},

	getUsersNeighborhood: function() {
		return this.data.users.neighborhood;
	},

	getADsByCat: function(cat, subcat) {
		if (!cat) {
			return this.data.ADsByCat;
		}

		if (!subcat && this.data.ADsByCat[cat]) {
			return this.data.ADsByCat[cat];
		} else if (subcat && this.data.ADsByCat[cat] && this.data.ADsByCat[cat][subcat]) {
			return this.data.ADsByCat[cat][subcat];
		}
		
		return false;
	},

	getCategoryString: function(catNum, catLetter) {
		return catNum + ((catLetter) ? '-' + catLetter : '');
	},

	getCatTitle: function(cat, subcat) {
		let formId = this.getFormId();
		if (!subcat) {
			return cat + ' ' + formsMetadata[formId][cat];
		} else if (subcat) {
			return cat + subcat + ' ' + formsMetadata[formId][cat].header + ((formsMetadata[formId][cat].subcats[subcat] !== '') ? ': ' + formsMetadata[formId][cat].subcats[subcat] : '');
		} else {
			return false;
		}
	},

	queryCategory: function(catNum, catLetter) {
		if (Object.keys(this.data.areaDescriptions).length === 0) {
			return [];
		}

		let arr = []; // array to store results

		Object.keys(this.data.areaDescriptions).map((neighborhoodId, i) => {
			if (this.data.areaDescriptions[neighborhoodId].areaDesc.hasOwnProperty(catNum) && typeof(catLetter) == 'undefined') {
				arr.push( { neighborhoodId: neighborhoodId, answer: this.data.areaDescriptions[neighborhoodId].areaDesc[catNum].a });
			} else if (this.data.areaDescriptions[neighborhoodId].areaDesc.hasOwnProperty(catNum) &&this.data.areaDescriptions[neighborhoodId].areaDesc[catNum].hasOwnProperty(catLetter)) {
				arr.push( { neighborhoodId: neighborhoodId, answer: this.data.areaDescriptions[neighborhoodId].areaDesc[catNum][catLetter].a });
			} else {
				arr.push({ neighborhoodId: neighborhoodId, answer: null });
			}
		});

		arr.sort(this.alphanumCase);

		return arr;
	},

	calculatedGradedArea: function(geometries) {
		let gradedTotalArea = 0;
		geometries.forEach((d) => {
			gradedTotalArea += d.area;
		});

		return gradedTotalArea;
	},

	calculateGradedAreaOfRings: function(geometries) {
		let gradedAreaOfRings = {1:0,2:0,3:0,4:0};
		geometries.forEach((d) => {
			gradedAreaOfRings[d.ring] += d.area;
		});

		return gradedAreaOfRings;
	},

	calculateGradedAreaByGrade: function(geometries) {
		let gradedAreaByGrade = {'A':0,'B':0,'C':0,'D':0};
		geometries.forEach((d) => {
			gradedAreaByGrade[d.grade] += d.area;
		});

		return gradedAreaByGrade;
	},

	parseRingAreaGeometry: function(geometries) {
		if (geometries.length == 0) {
			return false;
		}

		let defaultProps = {
				the_geojson: {},
				inverted_geojson: {},
				percent: 0,
				overallPercent: 0
			},
			ringAreasGeometry  = {
				1: {A: defaultProps, B: defaultProps, C: defaultProps, D: defaultProps},
				2: {A: defaultProps, B: defaultProps, C: defaultProps, D: defaultProps},
				3: {A: defaultProps, B: defaultProps, C: defaultProps, D: defaultProps},
				4: {A: defaultProps, B: defaultProps, C: defaultProps, D: defaultProps}
			};

		geometries.forEach((d) => {
			ringAreasGeometry[d.ring].density = this.data.gradedAreaOfRings[d.ring] / d.ring_area;
			ringAreasGeometry[d.ring][d.grade] = {
				'the_geojson': JSON.parse(d.the_geojson),
				'inverted_geojson': JSON.parse(d.inverted_geojson),
				'percent': d.area / this.data.gradedAreaOfRings[d.ring],
				'overallPercent': d.area / this.data.gradedArea
			};
		});

		return ringAreasGeometry;
	},

	parseRingStats: function(ringStats) {
		if (!ringStats || ringStats.length == 0) {
			return false;
		}

		/* let ringCumulative = {
				1: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'total': 0},
				2: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'total': 0},
				3: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'total': 0},
				4: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'total': 0}
			},
			areaOfRings = {},
			totalGradedArea = 0, 
			ringStats = { 1 : {}, 2: {}, 3: {}, 4: {} };
		ringAreaGeometry.forEach((ring) => {
			ringCumulative[ring.ring_id][ring.holc_grade] += ring.area;
			ringCumulative[ring.ring_id].total += ring.area;
			areaOfRings[ring.ring_id] = ring.ring_area;
			totalGradedArea += ring.area;
		});
		console.log(totalGradedArea);
		Object.keys(ringCumulative).map((ring_id) => {
			Object.keys(ringCumulative[ring_id]).map((grade) => {
				ringStats[ring_id][grade] = (ringStats[ring_id][grade]) ? ringStats[ring_id][grade] : {};
				ringStats[ring_id][grade].percent = ringCumulative[ring_id][grade] / ringCumulative[ring_id].total;
				ringStats[ring_id].density = ringCumulative[ring_id].total / areaOfRings[ring_id];
				ringStats[ring_id][grade].overallPercent = ringCumulative[ring_id][grade] / totalGradedArea;
			});
		}); */

		//format for D3
		console.log(ringStats);
		let formattedStats = [];
		for (let ringId = 1; ringId <= 4; ringId++) {
			let percents = [];
			['A','B','C','D'].forEach(grade => {
				if (ringStats[ringId][grade].overallPercent > 0) {
					percents.push({ 
						percent: ringStats[ringId][grade].percent, 
						overallPercent: ringStats[ringId][grade].overallPercent, 
						opacity: ringStats[ringId].density, 
						ringId: ringId, 
						grade: grade 
					});
				}
			});
			formattedStats.push({percents: percents});
		}

		console.log(formattedStats);

		return formattedStats;
	},

	hasLoaded: function() {
		return this.data.hasLoaded;
	},

	parseGradeStats: function(ringAreasGeometry) {
		let grades = ['A','B','C','D'];

		//format for D3
		return grades.map((grade) => {
			return {
				grade: grade,
				percent: this.data.gradedAreaByGrade[grade] / this.data.gradedArea
			};
		});
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
Object.assign(CityStore, EventEmitter.prototype);

// Register callback to handle all updates
CityStore.dispatchToken = AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.ADCategorySelected:
			CityStore.setSelectedCategory(action.value);
			CityStore.setSelectedHolcId(null);
			break;

		case AppActionTypes.loadInitialData:
			if (action.state.selectedCity) {
				CityStore.loadData(action.state.selectedCity, true);
			}
			if (action.state.selectedNeighborhood) {
				CityStore.setSelectedHolcId(action.state.selectedNeighborhood);
			}
			if (action.state.selectedCategory) {
				CityStore.setSelectedCategory(action.state.selectedCategory);
			}
			break;

		case AppActionTypes.citySelected:
			CityStore.loadData(action.value, action.selectedByUser);
			CityStore.setSelectedHolcId(null);
			CityStore.setSelectedCategory(null);
			break;

		case AppActionTypes.gradeSelected:
			CityStore.setSelectedGrade(action.value);
			break;

		case AppActionTypes.neighborhoodHighlighted:
			CityStore.setHighlightedHolcId(action.holcId);
			break;

		case AppActionTypes.neighborhoodSelected:
			CityStore.setSelectedCategory(null);
			CityStore.setSelectedHolcId(action.holcId);
			if (action.adId !== CityStore.getId()) {
				CityStore.loadData(action.adId, false);
			}
			break;

		case AppActionTypes.ringGradeSelected:
			CityStore.setSelectedRingGrade(action.value);
			break;

		case AppActionTypes.stateSelected:
			CityStore.loadData(null);
			break;

		case AppActionTypes.mapMoved:
			AppDispatcher.waitFor([MapStateStore.dispatchToken]);

			// you have to wait for initial load of mapstore
			const waitingInitialLoad = setInterval(() => {
				clearInterval(waitingInitialLoad);

				let visibleAdIds = MapStateStore.getVisibleAdIds();
				// unload city if nothing's visible or below zoom threshold
				if (visibleAdIds.length == 0 || !MapStateStore.isAboveZoomThreshold()) {
					CityStore.loadData(null);
				}
				// load a city if there's only one visible and it's different
				else if (visibleAdIds.length == 1 && visibleAdIds[0] !== CityStore.getId()) {
					CityStore.loadData(visibleAdIds[0], { zoomTo: false });
				} 
				// unload the city if there are more than one but it's not among them
				else if (visibleAdIds.length > 1 && visibleAdIds.indexOf(CityStore.getId()) == -1) {
					CityStore.loadData(null);
				}
				// unload city if more than one are visible and it's below the zoom threshold
				else if (visibleAdIds.length > 1 && !MapStateStore.isAboveZoomThreshold()) {
					CityStore.loadData(null);
				} 
			}, 100);
			break;
	}


	return true;

});


export default CityStore;