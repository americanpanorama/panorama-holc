import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import Leaflet from 'leaflet';
import formsMetadata from '../../data/formsMetadata.json';


const CityStore = {

	data: {
		id: null,
		name: null,
		state: null,
		year: null,
		ringAreaSelected: {
			ringId: 0,
			grade: ''
		},
		gradeSelected: null,
		areas: {},
		ringAreasGeometry: [], // not the rings themselves but the intersection of rings and areas
		loopLatLng: [],
		// the distance in meters between the loop center and the outermost point
		outerRingRadius: null,
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
		areaDescriptions: {},
		ADsByCat: {},
		polygonBoundingBox: null,
		polygonsCenter: null,
		gradedArea: null,
		gradedAreaOfRings: {},
		gradedAreaByGrade: {}
	},

	// TODO: Make a generic DataLoader class to define an interface,
	// and let CartoDBLoader extend and implement that?
	// Basic idea is that anything with a query method that returns a Promise
	// that resolves with an array of response data or rejects with an error
	// can be used here.
	dataLoader: CartoDBLoader,

	loadData: function (cityId, options) {
		let initial = (typeof(options.initial) !== 'undefined') ? options.initial : false,
			zoomTo = (typeof(options.zoomTo) !== 'undefined') ? options.zoomTo : false;

		this.dataLoader.query([
			{
				query: 'SELECT * from holc_ads where id = ' + cityId,
				format: 'JSON'
			},
			{
				query: 'WITH the_hull as (select ST_Collect(digitalscholarshiplab.holc_polygons.the_geom_webmercator) as hull, ad_id FROM digitalscholarshiplab.holc_polygons where ad_id = ' + cityId + ' GROUP BY ad_id), maxdist as (SELECT st_distance_sphere(st_transform(st_endpoint(st_longestline(st_transform(ST_SetSRID(ST_MakePoint(looplng,looplat),4326),3857), hull)), 4326), ST_SetSRID(ST_MakePoint(looplng,looplat), 4326)) as outerringradius, st_length(st_longestline(st_transform(ST_SetSRID(ST_Point(looplng,looplat),4326),3857), hull)) / 3.5 as distintv, ST_Transform(ST_SetSRID(ST_MakePoint(looplng,looplat),4326),3857)::geometry as the_point from the_hull join holc_ads on the_hull.ad_id = holc_ads.id and holc_ads.id = ' + cityId + ' Order by distintv DESC Limit 1 ), city_buffers as (SELECT ST_Transform((ST_Buffer(the_point,distintv * 3.5,\'quad_segs=32\')::geometry),3857) as buffer4, ST_Transform((ST_Buffer(the_point,distintv * 2.5,\'quad_segs=32\')::geometry),3857) as buffer3, ST_Transform((ST_Buffer(the_point,distintv * 1.5,\'quad_segs=32\')::geometry),3857) as buffer2, ST_Transform((ST_Buffer(the_point,distintv * 0.5,\'quad_segs=32\')::geometry),3857) as buffer1 FROM maxdist), city_rings as (SELECT ST_Difference(buffer4, buffer3) as the_geom_webmercator, 4 as ring_id, st_area(ST_Difference(buffer4, buffer3)) as ring_area from city_buffers union all select ST_Difference(buffer3, buffer2) as the_geom_webmercator, 3 as ring_id, st_area(ST_Difference(buffer3, buffer2)) as ring_area from city_buffers union all select ST_Difference(buffer2, buffer1) as the_geom_webmercator, 2 as ring_id, st_area(ST_Difference(buffer2, buffer1)) as ring_area from city_buffers union all select buffer1 as the_webmercator, 1 as ring_id, st_area(buffer1) as ring_area from city_buffers ), combined_grades as (SELECT holc_grade, ST_union(the_geom_webmercator) as the_geom_webmercator FROM digitalscholarshiplab.holc_polygons where ad_id = ' + cityId + ' group by holc_grade) SELECT holc_grade as grade, ring_id as ring, ST_AsGeoJSON(ST_Transform(ST_Intersection(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator),4326), 4) as the_geojson, ST_AsGeoJSON(ST_Transform(ST_Difference(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator),4326), 4) as inverted_geojson, st_area(ST_Intersection(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator)) as area, ST_Area(city_rings.the_geom_webmercator) as ring_area, outerringradius FROM city_rings, combined_grades, maxdist',
				format: 'JSON'
			},
			{
				query: 'SELECT holc_id, holc_grade, polygon_id, cat_id, sub_cat_id, _order as order, data, ST_asgeojson (holc_polygons.the_geom, 3) as the_geojson, st_area(holc_polygons.the_geom::geography)/1000000 * 0.386102 as sqmi FROM holc_ad_data right join holc_polygons on holc_ad_data.polygon_id = holc_polygons.neighborhood_id join holc_ads on holc_ads.id = holc_polygons.ad_id where holc_ads.id = ' + cityId + ' order by holc_id, cat_id, sub_cat_id, _order',
				//'SELECT q.category_id, q.label, q.question, q.question_id, c.category, c.cat_label, ad.answer, ad.neighborhood_id, hp.ad_id, hp.holc_grade, hp.holc_id, hp.holc_lette, hp.id, ST_asgeojson (hp.the_geom) as the_geojson FROM questions as q JOIN category as c ON c.category_id = q.category_id JOIN area_descriptions as ad ON ad.question_id = q.question_id JOIN holc_polygons as hp ON hp.id = ad.neighborhood_id WHERE ad_id=' + cityId,
				format: 'JSON'
			},
			{
				query: 'Select st_x(st_centroid(ST_SetSRID(st_extent(the_geom),4326))) as centerLng, st_y(st_centroid(ST_SetSRID(st_extent(the_geom),4326))) as centerLat, st_xmin(ST_SetSRID(st_extent(the_geom),4326)) as minlng, st_ymin(ST_SetSRID(st_extent(the_geom),4326)) as minlat, st_xmax(ST_SetSRID(st_extent(the_geom),4326)) as maxlng, st_ymax(ST_SetSRID(st_extent(the_geom),4326)) as maxlat from digitalscholarshiplab.holc_polygons where ad_id = ' + cityId,
				format: 'JSON'
			}
		]).then((response) => {
			this.data.id = cityId;

			let cityData = response[0][0];
			this.data.name = cityData.city;
			this.data.state = cityData.state;
			this.data.year = cityData.year;
			this.data.form_id = cityData.form_id;
			this.data.cityData = cityData;
			this.data.ringAreaSelected = {
				ringId: 0,
				grade: ''
			};

			let ringData = response[1];
			this.data.gradedArea = this.calculatedGradedArea(ringData);
			this.data.gradedAreaOfRings = this.calculateGradedAreaOfRings(ringData);
			this.data.gradedAreaByGrade = this.calculateGradedAreaByGrade(ringData);
			this.data.ringAreasGeometry = this.parseRingAreaGeometry(ringData);
			this.data.ringStats = this.parseRingStats(this.data.ringAreasGeometry);
			this.data.outerRingRadius = (response[1][0]) ? response[1][0].outerringradius : false;
			this.data.loopLatLng = (cityData) ? [cityData.looplat, cityData.looplng] : false;
			this.data.areaDescriptions = this.parseAreaDescriptions(response[2]);
			this.data.ADsByCat = this.parseADsByCat();
			this.data.gradeStats = this.parseGradeStats(this.data.ringAreasGeometry);

			let polygonLatLngs = response[3][0];
			if (polygonLatLngs.minlat) {
				this.data.polygonBoundingBox = [ [polygonLatLngs.minlat, polygonLatLngs.minlng], [polygonLatLngs.maxlat, polygonLatLngs.maxlng] ];
				this.data.polygonsCenter = [ polygonLatLngs.centerlat, polygonLatLngs.centerlng ];
			}

			//console.log('[4b] CityStore updated its data and calls storeChanged');
			if (initial) {
				this.emit(AppActionTypes.initialDataLoaded);
			} else {
				this.emit(AppActionTypes.storeChanged, {zoomToCity: zoomTo});
			}

		}, (error) => {
			// TODO: handle this.
			console.log('Commodity received error:', error);
			throw error;
		});
	},

	citySelected: function(cityId, options) {
		this.loadData(cityId, options);
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

	getSelectedRingAreas: function() {
		return this.data.ringAreaSelected;
	},

	getSelectedGrade: function() {
		return this.data.gradeSelected;
	},

	getGeoJsonForSelectedRingArea: function(ring, grade) {
		return this.data.ringAreasGeometry[ring][grade].the_geojson;
	},

	getInvertedGeoJsonForSelectedRingArea: function(ring, grade) {
		return this.data.ringAreasGeometry[ring][grade].inverted_geojson;
	},

	getGeoJsonForGrade: function(grade) {
		let polygons = [[[0,0], [0, 90], [-180, 90], [-180, 0], [0,0]]],
			holes = [];
		Object.keys(this.data.areaDescriptions).forEach((id, i) => {
			if (this.data.areaDescriptions[id].holc_grade == grade) {
				this.data.areaDescriptions[id].area_geojson.coordinates[0].forEach((coords, i2) => {
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

	getOuterRingRadius: function() {
		return this.data.outerRingRadius;
	},

	getLoopLatLng: function() {
		return this.data.loopLatLng;
	},

	getAreaDescriptions: function() {
		return this.data.areaDescriptions;
	},

	getPolygonsBounds: function() {
		return this.data.polygonBoundingBox;
	},

	getPolygonsCenter: function() {
		return this.data.polygonsCenter;
	},

	hasADData: function() {
		let ADValues = Object.keys(this.data.areaDescriptions).map((holc_id) => this.data.areaDescriptions[holc_id].areaDesc);
		return ADValues.reduce((a, b) => a || typeof b === 'object', false);
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

	getPreviousAreaId: function(areaId) {
		let formIds = Object.keys(this.data.areaDescriptions).sort(this.alphanumCase);
		return formIds[formIds.indexOf(areaId) - 1];
	},

	getNextAreaId: function(areaId) {
		let formIds = Object.keys(this.data.areaDescriptions).sort(this.alphanumCase);
		return formIds[formIds.indexOf(areaId) + 1];
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

	getPreviousCatIds: function(catNum, catLetter) {
		let formId = this.getFormId();
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

	getNextCatIds: function(catNum, catLetter) {
		let formId = this.getFormId();
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

	getArea: function () {
		return Object.keys(this.data.areaDescriptions).map((id, i) => this.data.areaDescriptions[id].sqmi ).reduce((a,b) => a+b, 0);
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

		let ringAreasGeometry  = {
			1: {'A':{},'B':{},'C':{},'D':{}},
			2: {'A':{},'B':{},'C':{},'D':{}},
			3: {'A':{},'B':{},'C':{},'D':{}},
			4: {'A':{},'B':{},'C':{},'D':{}}
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
		let formattedStats = [];
		for (let ringId = 1; ringId <= 4; ringId++) {
			formattedStats.push({ 
				percents: [ 
					{ percent: ringStats[ringId].A.percent, overallPercent: ringStats[ringId].A.overallPercent, ringId: ringId, opacity: ringStats[ringId].density, grade: 'A' }, 
					{ percent: ringStats[ringId].B.percent, overallPercent: ringStats[ringId].B.overallPercent, ringId: ringId, opacity: ringStats[ringId].density, grade: 'B' }, 
					{ percent: ringStats[ringId].C.percent, overallPercent: ringStats[ringId].C.overallPercent, ringId: ringId, opacity: ringStats[ringId].density, grade: 'C' }, 
					{ percent: ringStats[ringId].D.percent, overallPercent: ringStats[ringId].D.overallPercent, ringId: ringId, opacity: ringStats[ringId].density, grade: 'D' } 
				] });
		}

		return formattedStats;
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

	parseInvertedGeoJson: function(geojson) {
		//Create a new set of latlngs, adding our world-sized ring first
		let NWHemisphere = [[0,0], [0, 90], [-180, 90], [-180, 0], [0,0]],
			newLatLngs = [ NWHemisphere ],
			holes =[];

		geojson.coordinates[0].forEach((element, i) => {
			if (i == 0) {
				newLatLngs.push(element);
			} else {
				holes.push(element);
			}
		});
		geojson.coordinates = (holes.length > 0) ? [newLatLngs.concat(holes)] : [newLatLngs]

		return geojson;
	},

	parseADsByCat: function() {
		let ADsByCat = {},
			  ADs = this.data.areaDescriptions;
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
AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			//console.log(`[2] The '${ AppActionTypes.loadInitialData }' event is handled by CityStore....`);
			if (action.state.selectedCity) {
				CityStore.loadData(action.state.selectedCity, {initial: true, zoomTo: true});
			}
			break;

		case AppActionTypes.citySelected:
			CityStore.citySelected(action.value, action.options);
			break;

		case AppActionTypes.ringAreaSelected:
			CityStore.ringAreaSelected(action.value);
			break;

	}


	return true;

});


export default CityStore;