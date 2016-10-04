import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import * as d3 from 'd3';
import { AppActions } from '../utils/AppActionCreator';
import Downloader from './Downloader.jsx';

export default class CityStats extends React.Component {

	// property validation
	static propTypes = {
		ringStats: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
		gradeStats: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
		areaSelected: PropTypes.func,
		areaUnselected: PropTypes.func,
		gradeSelected: PropTypes.func,
		gradeUnselected: PropTypes.func
	};

	// (instead of ES5-style getDefaultProps)
	static defaultProps = {
		name: '',
		ringStats: {
			1: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'density': 0},
			2: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'density': 0},
			3: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'density': 0},
			4: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'density': 0}
		},
		gradeStats: {
			'A':{'area':0,'percent':0},
			'B':{'area':0,'percent':0},
			'C':{'area':0,'percent':0},
			'D':{'area':0,'percent':0},
		}
	};

	constructor (props) {
		super(props);
	};

	shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.hasADs !== this.props.hasADs || nextProps.popStats !== this.props.popStats || nextProps.downloadOpen !== this.props.downloadOpen) {
			return true;
		}
		// don't know why this is necessary, but the component is updating on mouseover--this prevents that.
		return (nextProps.ringStats !== this.props.ringStats);
	};
	
	componentWillMount () {};

	componentDidMount() {
		this.d3NestedPieChart.onHover = this.props.areaSelected.bind(this);
		this.d3NestedPieChart.onHoverOut = this.props.areaUnselected.bind(this);
		this.d3NestedPieChart.onGradeHover = this.props.gradeSelected.bind(this);
		this.d3NestedPieChart.onGradeHoverOut = this.props.gradeUnselected.bind(this);
		if (this.props.ringStats) {
			this.d3NestedPieChart.update(this.refs.content, this.props.ringStats, this.props.gradeStats);
		}
	}

	componentDidUpdate () {
		this.d3NestedPieChart.destroy(this.refs.content);
		this.d3NestedPieChart.onHover = this.props.areaSelected.bind(this);
		this.d3NestedPieChart.onHoverOut = this.props.areaUnselected.bind(this);
		this.d3NestedPieChart.onGradeHover = this.props.gradeSelected.bind(this);
		this.d3NestedPieChart.onGradeHoverOut = this.props.gradeUnselected.bind(this);
		if (this.props.ringStats) {
			this.d3NestedPieChart.update(this.refs.content, this.props.ringStats, this.props.gradeStats);
		}
	}

	areaHover (selectedRingId, selectedGrade) {
		AppActions.ringAreaSelected(selectedRingId, selectedGrade);
	}

	getPopLabel (key) {
		const labels = {
			white: 'white',
			black: 'African American',
			asianAmerican: 'Asian American',
			nativeAmerican: 'Native American'
		}

		return labels[key];
	}

	findAndFormatPercent(year, cat) {
		let proportion = this.props.popStats[year].percents.filter(pop => (pop.label == cat))[0].proportion;
		return (proportion !== null) ? (Math.round(proportion * 1000) / 10) + '%' : '---';
	}

	render () {

		let area = (this.props.area) ? Math.round(this.props.area * 100) / 100 + 'sq mi' : '';
			
		return (
			<div className='cityStats'>
				<h1>
					{/* href for indexing */}
					<a 
						href={ 'http://dsl.richmond.edu/panorama/redlining/#city=' + this.props.slug }
						onClick={ this.props.onCitySelected }
						id={ this.props.adId }
					>
						{this.props.name + ', '}
					</a>
					<span 
						onClick={ this.props.onStateSelected } 
						id={ this.props.state }
					>
						{ this.props.state }
					</span>

					<span className='downloadicon' onClick={ this.props.onDownloadClicked }></span>
				</h1>

				{ (this.props.downloadOpen) ?
					<Downloader 
						rasters={ this.props.rasters }
						hasADData={ this.props.hasADData }
						downloadGeojson={ this.props.downloadGeojson }
						bucketPath={ this.props.bucketPath }
						name={ this.props.name }
					/> :
					null
				}
				

				{ (this.props.hasADData || this.props.hasADImages) ?
					<div className='adInstructions'>click on neighborhoods on the map to read their area description</div> : 
					<div className='adInstructions'>area descriptions aren't available for this city, but will be soon</div>
				}

				{ (this.props.popStats && this.props.popStats[1930].total && this.props.popStats[1940].total) ? 
					<table className='population-stats'>
						<tbody>
							<tr>
								<th></th>
								<th>1930</th>
								<th>1940</th>
							</tr>
							<tr>
								<td>Population</td>
								<td className='total' key='total1930'>{ this.props.popStats[1930].total.toLocaleString() }</td>
								<td className='total' key='total1940'>{ this.props.popStats[1940].total.toLocaleString() }</td>
							</tr>
							{
								this.props.popStats.order.map(cat => {
									return (
										<tr key={ cat }>
											<td>{ cat }</td>
											<td>{ this.findAndFormatPercent(1930, cat) }</td>
											<td>{ this.findAndFormatPercent(1940, cat) }</td>
										</tr>
									);
								})
							}
							
						</tbody>
					</table> :
					''
				}


				<div className='nestedpiechart'>
					<button 
						className='intro-button' 
						 
					>
						<span className='icon info' id='burgess' onClick={ this.props.openBurgess } />
					</button>
					{ (this.props.ringStats) ?
						<div className='content' ref='content'></div> :
						<p>Area descriptions are not yet available but will be eventually.</p>
					}
					
				</div>
			</div>
		);
	}

	d3NestedPieChart = {
		// layout constants
		HEADER: 25,
		WIDTH: 250,
		DIAMETER: 250, // of the donut
		STATSHEIGHT: 18,
		DONUTWIDTH: 35,
		MARGIN: 10,

		update: function(node, ringstats, gradeStats) {
			if (Object.keys(ringstats).length === 0) { 
				this.destroy();
				return; 
			}

			let scope = this;	
			var color = function(i) { return ['#418e41', '#4a4ae4', '#ffdf00', '#eb3f3f'][i]; };
			var colorBorder = function(i) { return ['#418e41', '#4a4ae4', '#ffdf00', '#eb3f3f'][i]; };
			var colorGrade = function(grade) {
				let gradeColors = {'A':'#418e41','B':'#4a4ae4','C':'#ffdf00','D':'#eb3f3f'};
				return gradeColors[grade];
			};

			var barPercents = [];
			ringstats.forEach(aRingStats => {
				barPercents = barPercents.concat(aRingStats.percents.map(aRingAndGradeStats => aRingAndGradeStats));
			});
			barPercents.sort((a,b) => { return (a.grade < b.grade) ? -1 : (a.grade > b.grade) ? 1 : (a.ringId < b.ringId) ? -1 : 1; });
			var xOffset = 0;
			barPercents.forEach((slice, i) => {
				barPercents[i].xOffset = xOffset;
				xOffset += Math.round(scope.WIDTH * slice.overallPercent) / scope.WIDTH;
			});

			var pie = d3.layout.pie()
				.value((d) => d.percent)
				.sort(null);
			var arc = d3.svg.arc()
				.innerRadius((d) => (d.data.ringId - 1.5) * scope.DONUTWIDTH)
				.outerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH);
			var arcBorder = d3.svg.arc()
				.innerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH)
				.outerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH);
			var percent = d3.format(',%');
			var stack = d3.layout.stack();
	
			// <g> for each ring
			let ringNodes = d3.select(node)
				.append('svg')
				.attr('width', scope.WIDTH)
				.attr('height', scope.HEADER * 2 + scope.MARGIN * 5 + scope.STATSHEIGHT + scope.DIAMETER)
				.attr('id', 'piechart')
				.selectAll('g')
				.data(ringstats)
				.enter().append('g');
				//.attr('transform', 'translate(' + (scope.WIDTH / 2) + ',' + (scope.HEIGHT / 2 + 50) + ')');
	
			// path for each pie piece
			let burgess = ringNodes
			  .selectAll('path')
			  .data((d) => pie(d.percents))
			  .enter().append('path')
			  .filter((d) => d.data.percent > 0)
			  .attr('transform', 'translate(' + (scope.WIDTH / 2) + ',' + (scope.HEADER * 2 + scope.MARGIN * 5 + scope.STATSHEIGHT + scope.DIAMETER / 2) + ')')
			  .attr('d', arc)
			  .attr('fill', (d,i) => colorGrade(d.data.grade))
			  .attr('fill-opacity', (d) => d.data.opacity)
			  .attr('stroke', (d,i) => colorGrade(d.data.grade))
			  .attr('stroke-width', 0)
			  .attr('data-opacity', (d) => d.data.opacity)
			  .attr('class', (d) => 'sliceGrade' + d.data.grade)
			  .on('mouseover', function(d) {
				  d3.select(this)
					.transition()
					.duration(2000)
				  	.attr('fill-opacity', 1);
				  d3.select('#ring' + d.data.ringId + 'grade' + d.data.grade)
				    .attr('opacity', 1);
				  d3.selectAll('.areaBar')
					.transition()
					.duration(2000)
					.attr('height', scope.STATSHEIGHT * 0.5)
					.attr('y', scope.HEADER + scope.MARGIN + scope.STATSHEIGHT * 0.25)
					.attr('opacity', .25);
				  d3.selectAll('.barGrade' + d.data.grade)
					.filter('.ring' + d.data.ringId)
					.attr('height', scope.STATSHEIGHT)
					.attr('y', scope.HEADER + scope.MARGIN)
					.transition()
					.duration(2000)
					.attr('opacity', 1);
				  d3.selectAll('.barGradePercent' + d.data.grade)
					.filter('.ring' + d.data.ringId)
					.transition()
					.duration(500)
					.attr('opacity', 1);
				  d3.selectAll('.overallPercent')
				  	.transition()
					.attr('opacity', 0);
				  scope.onHover(d.data.ringId, d.data.grade);
			  })
			  .on('mouseout', function(d) {
				  scope.onHoverOut();
				  d3.select(this)
				    .transition()
					.attr('fill-opacity', (d) => d.data.opacity);
				  d3.select('#ring' + d.data.ringId + 'grade' + d.data.grade )
					.attr('opacity', 0);
				  d3.selectAll('.areaBar')
					.transition()
					.duration(2000)
					.attr('height', scope.STATSHEIGHT)
					.attr('y', scope.HEADER + scope.MARGIN)
					.attr('opacity', .7);
				  d3.selectAll('.areaBarPercent')
				  	.transition()
					.attr('opacity', 0);
				  d3.selectAll('.overallPercent')
				  	.transition()
					.attr('opacity', 1);
			  });	

			// add thin stroke line for each slice of pies
			ringNodes
			  .selectAll('path.border')
			  .data((d) => pie(d.percents) )
			  .enter().append('path')
			  .classed('border', true)
			  .attr('transform', 'translate(' + (scope.WIDTH / 2) + ',' + (scope.HEADER * 2 + scope.MARGIN * 5 + scope.STATSHEIGHT + scope.DIAMETER / 2) + ')')
			  .attr('d', arcBorder)
			  .attr('fill', (d,i) => color(i))
			  .attr('stroke', (d,i) => colorBorder(i))
			  .attr('stroke-width', 0.25)
			  .attr('stroke-opacity', 0.7);

			// a tranparent border around each slice
			// it's made opaque for highlighting and thus needs
			// to be added after the slice and the border
			ringNodes
			  .selectAll('paths.sliceBorder')
			  .data((d) => pie(d.percents))
			  .enter().append('path')
			  .filter((d) => d.data.percent > 0)
			  .attr('transform', 'translate(' + (scope.WIDTH / 2) + ',' + (scope.HEADER * 2 + scope.MARGIN * 5 + scope.STATSHEIGHT + scope.DIAMETER / 2) + ')')
			  .attr('d', arc)
			  .attr('fill-opacity', 0)
			  .attr('stroke', (d,i) => colorGrade(d.data.grade))
			  .attr('stroke-width', 0)
			  .attr('pointer-events', 'none')
			  .attr('class', (d) => 'sliceBorder grade' + d.data.grade);

			// add text for each slice of pie
			ringNodes
			  .selectAll('text.burgessSlicePercent')
			  .data((d) => pie(d.percents) )
			  .enter().append('text')
			  .filter((d) => d.data.percent > 0)
			  .attr('transform', (d) => 'translate(' + (arc.centroid(d)[0] + scope.WIDTH / 2) + ',' + (arc.centroid(d)[1] + scope.HEADER * 2 + scope.MARGIN * 5 + scope.STATSHEIGHT + scope.DIAMETER / 2) + ')')
			  .attr('text-anchor', 'middle')
			  .style('font', '11px Arial')
			  .attr('dy', 5.5)
			  
			  .attr('opacity', 0)
			  .attr('id', (d) => 'ring' + d.data.ringId + 'grade' + d.data.grade)
			  .attr('class', (d) => 'burgessSlicePercent grade' + d.data.grade)
			  .attr('fill', (d) => (d.data.grade == 'C') ? 'black' : 'white')
			  .attr('pointer-events', 'none')
			  .text((d) => percent(d.value));

			ringNodes
			  .selectAll('rect')
			  .data(barPercents)
			  .enter().append('rect')
			  .attr('class', (d,i) => 'areaBar barGrade' + d.grade + ' ring' + d.ringId)
			  .attr('height', scope.STATSHEIGHT)
			  .attr('width', (d,i) => Math.round(d.overallPercent * scope.WIDTH))
			  .attr('opacity', .7)
			  .attr('y', scope.HEADER + scope.MARGIN)
			  .attr('x', d => Math.round(d.xOffset * scope.WIDTH))
			  .attr('fill', d => colorGrade(d.grade))
			  .on('mouseover', function(d,i) {
				d3.selectAll('.areaBar')
				  .transition()
				  .duration(1000)
				  .attr('opacity', .4);
				d3.selectAll('rect.barGrade' + d.grade)
				  .transition()
				  .duration(1000)
				  .attr('opacity', 1);
				d3.selectAll('.sliceBorder')
				  .filter('.grade' + d.grade)
				  .transition()
				  .duration(1000)
				  .attr('stroke-width', 5);
				d3.selectAll('.burgessSlicePercent')
				  .filter('.grade' + d.grade)
				  .filter((d) => d.data.percent > .06)
				  .transition()
				  .attr('fill', 'black')
				  .attr('opacity', 1);
				scope.onGradeHover(d.grade);
			  }).
			  on('mouseout', function(d,i) {
				d3.selectAll('.areaBar')
				  .transition()
				  .attr('opacity', .7);
				d3.selectAll('.sliceBorder')
				  .transition()
				  .attr('stroke-width', 0);
				d3.selectAll('.burgessSlicePercent')
				  .transition()
				  .attr('opacity', 0)
				  .attr('fill', (d) => (d.data.grade == 'C') ? 'black' : 'white');
				scope.onGradeHoverOut();
			  });

			// percents for each of these slices in the area chart
			ringNodes
			  .selectAll('text.slicePercent')
			  .data(barPercents)
			  .enter().append('text')
			  .attr('x', d => Math.round(d.xOffset * scope.WIDTH + d.overallPercent / 2 * scope.WIDTH))
			  .attr('y', scope.HEADER + scope.MARGIN + 13)
			  .attr('class', d => 'areaBarPercent barGradePercent' + d.grade + ' ring' + d.ringId)
			  .attr('pointer-events', 'none')
			  .attr('text-anchor', 'middle')
			  .attr('font-family', 'sans-serif')
			  .attr('font-size', '10px')
			  .attr('fill', d => (d.grade == 'C') ? 'black' : 'white')
			  .attr('opacity', 0)
			  .text(d => percent(d.overallPercent));

			ringNodes
			  .selectAll('text.overallPercent')
			  .data(gradeStats)
			  .enter()
			  .append('text')
			  .attr('x', (d, i) => {
				let x = d.percent * scope.WIDTH / 2;
				for (let i0 = 0; i0 < i; i0++) {
					x += gradeStats[i0].percent * scope.WIDTH;
				}
				return x;
			  })
			  .attr('y', scope.HEADER + scope.MARGIN + 13)
			  .attr('pointer-events', 'none')
			  .attr('text-anchor', 'middle')
			  .attr('font-family', 'sans-serif')
			  .attr('font-size', '10px')
			  .attr('fill', (d) => (d.grade == 'C') ? 'black' : 'white')
			  .classed('overallPercent', true)
			  .text((d) => percent(d.percent));

			ringNodes
			  .append('text')
			  .attr('x', scope.WIDTH / 2)
			  .attr('y', scope.HEADER)
			  .attr('text-anchor', 'middle')
			  .text('Grading in Terms of Area');

			ringNodes
			  .append('text')
			  .attr('x', scope.WIDTH / 2)
			  .attr('y', scope.HEADER + scope.MARGIN * 4 + scope.STATSHEIGHT)
			  .attr('text-anchor', 'middle')
			  .text('Grading & Density Outward');

			ringNodes
			  .append('text')
			  .attr('x', scope.WIDTH / 2)
			  .attr('y', scope.HEADER * 2 + scope.MARGIN * 4 + scope.STATSHEIGHT)
			  .attr('text-anchor', 'middle')
			  .text('from City Center');

			d3.xml('static/burgess.svg').get((error, xml) => {
				if (error) throw error;

				let burgessDiagram = ringNodes.node().appendChild(xml.documentElement);

				var innerSVG = ringNodes.select("svg");

				innerSVG
					.attr('x', -5)
					.attr('y', 102);

				innerSVG.transition().duration(10000)
					.attr('opacity', .35);
			});

		},

		onHover: function() {
			// bound in componentDidMount to the areaSelected method of App (passed in as a props)
		},

		onHoverOut: function() {
			// bound in componentDidMount to the areaUnselected metthod of App
		},

		onGradeHover: function() {
			// bound in componentDidMount to the gradeSelected method of App (passed in as a props)
		},

		onGradeHoverOut: function() {
			// bound in componentDidMount to the gradeUnselected metthod of App
		},
	
		destroy: function (node) {
			d3.select(node).html('');
		}
	}

};
