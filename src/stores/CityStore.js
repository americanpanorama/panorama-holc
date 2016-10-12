import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';
import CartoDBLoader from '../utils/CartoDBLoader';
import formsMetadata from '../../data/formsMetadata.json';
import MapStateStore from './MapStateStore';
import AreaDescriptionsStore from './AreaDescriptionsStore';
import CitiesStore from './CitiesStore';

/* City Store is responsible for maintaining most of the important state
variables: e.g. selected city, neighborhood, category, ring, grade, etc. */
const CityStore = {

	data: {
		id: null,
		name: null,
		state: null,
		year: null,
		slug: null,
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
			this.data.slug = null;
			this.data.hasLoaded = true;
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

		let the_queries = [
			// get ring polygons
			{
				query: 'WITH the_hull as (select ST_Collect(digitalscholarshiplab.holc_polygons.the_geom_webmercator) as hull, ad_id FROM digitalscholarshiplab.holc_polygons where ad_id = ' + cityId + ' GROUP BY ad_id), maxdist as (SELECT st_distance_sphere(st_transform(st_endpoint(st_longestline(st_transform(ST_SetSRID(ST_MakePoint(looplng,looplat),4326),3857), hull)), 4326), ST_SetSRID(ST_MakePoint(looplng,looplat), 4326)) as outerringradius, st_length(st_longestline(st_transform(ST_SetSRID(ST_Point(looplng,looplat),4326),3857), hull)) / 3.5 as distintv, ST_Transform(ST_SetSRID(ST_MakePoint(looplng,looplat),4326),3857)::geometry as the_point from the_hull join holc_ads on the_hull.ad_id = holc_ads.city_id and holc_ads.city_id = ' + cityId + ' Order by distintv DESC Limit 1 ), city_buffers as (SELECT ST_Transform((ST_Buffer(the_point,distintv * 3.5,\'quad_segs=32\')::geometry),3857) as buffer4, ST_Transform((ST_Buffer(the_point,distintv * 2.5,\'quad_segs=32\')::geometry),3857) as buffer3, ST_Transform((ST_Buffer(the_point,distintv * 1.5,\'quad_segs=32\')::geometry),3857) as buffer2, ST_Transform((ST_Buffer(the_point,distintv * 0.5,\'quad_segs=32\')::geometry),3857) as buffer1 FROM maxdist), city_rings as (SELECT ST_Difference(buffer4, buffer3) as the_geom_webmercator, 4 as ring_id, st_area(ST_Difference(buffer4, buffer3)) as ring_area from city_buffers union all select ST_Difference(buffer3, buffer2) as the_geom_webmercator, 3 as ring_id, st_area(ST_Difference(buffer3, buffer2)) as ring_area from city_buffers union all select ST_Difference(buffer2, buffer1) as the_geom_webmercator, 2 as ring_id, st_area(ST_Difference(buffer2, buffer1)) as ring_area from city_buffers union all select buffer1 as the_webmercator, 1 as ring_id, st_area(buffer1) as ring_area from city_buffers ), combined_grades as (SELECT holc_grade, ST_union(the_geom_webmercator) as the_geom_webmercator FROM digitalscholarshiplab.holc_polygons where ad_id = ' + cityId + ' group by holc_grade) SELECT holc_grade as grade, ring_id as ring, ST_AsGeoJSON(ST_Transform(ST_Intersection(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator),4326), 4) as the_geojson, ST_AsGeoJSON(ST_Transform(ST_Difference(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator),4326), 4) as inverted_geojson, st_area(ST_Intersection(city_rings.the_geom_webmercator, combined_grades.the_geom_webmercator)) as area, ST_Area(city_rings.the_geom_webmercator) as ring_area, outerringradius FROM city_rings, combined_grades, maxdist',
				format: 'JSON'
			},
			{
				query: 'Select round(st_x(st_centroid(ST_SetSRID(st_extent(the_geom),4326)))::numeric, 3) as centerLng, round(st_y(st_centroid(ST_SetSRID(st_extent(the_geom),4326)))::numeric, 3) as centerLat, round(st_xmin(ST_SetSRID(st_extent(the_geom),4326))::numeric, 3) as minlng, round(st_ymin(ST_SetSRID(st_extent(the_geom),4326))::numeric, 3) as minlat, round(st_xmax(ST_SetSRID(st_extent(the_geom),4326))::numeric, 3) as maxlng, round(st_ymax(ST_SetSRID(st_extent(the_geom),4326))::numeric, 3) as maxlat from digitalscholarshiplab.holc_polygons where ad_id =' + cityId,
				format: 'JSON'
			}
		];

		this.dataLoader.query(the_queries).then((response) => {
			this.data.id = parseInt(cityId);
			this.data.selectedByUser = selectedByUser;

			this.data.name = CitiesStore.getCityName(this.data.id);
			this.data.state = CitiesStore.getState(this.data.id);
			this.data.year = CitiesStore.getYear(this.data.id);
			this.data.slug = CitiesStore.getSlug(this.data.id);
			this.data.form_id = CitiesStore.getFormId(this.data.id);
			this.data.bucketPath = 'http://holc.s3-website-us-east-1.amazonaws.com/tiles/' + CitiesStore.getState(this.data.id) + '/' + CitiesStore.getMapParentFileName(this.data.id).replace(/\s+/g, '')  + '/' + CitiesStore.getYear(this.data.id) + '/';
			this.data.loopLatLng = CitiesStore.getCenterPoint(this.data.id);

			const ringData = response[0];
			this.data.gradedArea = this.calculateGradedArea(ringData);
			this.data.gradedAreaOfRings = this.calculateGradedAreaOfRings(ringData);
			this.data.gradedAreaByGrade = this.calculateGradedAreaByGrade(ringData);
			this.data.ringAreasGeometry = this.parseRingAreaGeometry(ringData);
			this.data.ringStats = this.parseRingStats(this.data.ringAreasGeometry);
			this.data.outerRingRadius = (response[0][0]) ? response[0][0].outerringradius : false;
			this.data.gradeStats = this.parseGradeStats(this.data.ringAreasGeometry);
			
			let polygonLatLngs = response[1][0];
			if (polygonLatLngs.minlat) {
				this.data.polygonBoundingBox = [ [polygonLatLngs.minlat, polygonLatLngs.minlng], [polygonLatLngs.maxlat, polygonLatLngs.maxlng] ];
				this.data.polygonsCenter = [ polygonLatLngs.centerlat, polygonLatLngs.centerlng ];
			} else {
				this.data.polygonBoundingBox = null;
				this.data.polygonsCenter = null;
			}

			this.data.hasLoaded = true;

			this.emit(AppActionTypes.storeChanged);

		}, (error) => {
			// TODO: handle this.
			console.log('CityStore received error:', error);
			throw error;
		});
	},

	calculateGradedArea: function(geometries) {
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

		//format for D3
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

		return formattedStats;
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
	
	getGradeStats: function() { return this.data.gradeStats; },

	getFormId: function() { return this.data.form_id; },

	getGeoJsonForSelectedRingArea: function(ring, grade) { return this.data.ringAreasGeometry[ring][grade].the_geojson; },

	getHighlightedHolcId: function() { return this.data.highlightedHolcId; },

	getId: function() { return this.data.id; },

	getInvertedGeoJsonForSelectedRingArea: function(ring, grade) { return this.data.ringAreasGeometry[ring][grade].inverted_geojson; },

	getLoopLatLng: function() { return this.data.loopLatLng; },

	getName: function() { return this.data.name; },

	getOuterRingRadius: function() { return this.data.outerRingRadius; },

	getPolygonsBounds: function() { return this.data.polygonBoundingBox; },

	getPolygonsCenter: function() { return this.data.polygonsCenter; },

	getRingAreasGeometry: function() { return this.data.ringAreasGeometry; },

	getRingStats: function() { return this.data.ringStats; },

	getSelectedByUser: function() { return this.data.selectedByUser; },

	getSelectedCategory: function() { return this.data.selectedCategory; },

	getSelectedHolcId: function() { return this.data.selectedHolcId; },

	getSelectedGrade: function() { return this.data.selectedGrade; },

	getSelectedRingGrade: function() { return this.data.selectedRingGrade; },

	getSlug: function() { return this.data.slug; },

	getState: function() { return this.data.state; },

	getUsersAdId: function() { return this.data.users.adId; },

	getUsersCity: function() { return this.data.users.city; },

	getUsersNeighborhood: function() { return this.data.users.neighborhood; },

	hasLoaded: function() {
		return this.data.hasLoaded;
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

			// you have to wait for initial load of CitiesStore before you can use the slug to get the city if one's requested
			// you also need to wait for raster store for overlapping maps
			if (action.hashState.city) {
				const waitingADsId = setInterval(() => {
					if (CitiesStore.hasLoaded()) {
						clearInterval(waitingADsId);

						if (action.hashState.city && CitiesStore.getADIdFromSlug(action.hashState.city)) {
							CityStore.loadData(CitiesStore.getADIdFromSlug(action.hashState.city), true);
							if (action.state.selectedNeighborhood) {
								CityStore.setSelectedHolcId(action.state.selectedNeighborhood);
							} else if (action.state.selectedCategory) {
								CityStore.setSelectedCategory(action.state.selectedCategory);
							}
						}
					}
				}, 10);
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
			// you have to wait for initial load of mapstore
			const waitingInitialLoad = setInterval(() => {
				if (MapStateStore.hasLoaded()) {
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
				}
			}, 10);
			break;
	}


	return true;

});


export default CityStore;