import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import * as d3 from 'd3';
import { AppActions } from '../utils/AppActionCreator';

export default class CityStats extends React.Component {

	// property validation
	static propTypes = {
		ringStats: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
		gradeStats: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
		areaSelected: PropTypes.func,
		areaUnselected: PropTypes.func,
		gradeSelected: PropTypes.func,
		gradeUnselected: PropTypes.func,
		triggerIntro: PropTypes.func,
		toggleBurgessDiagram: PropTypes.func,
		burgessDiagramVisible: PropTypes.bool,
		cityData: PropTypes.object
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
		// don't know why this is necessary, but the component is updating on mouseover--this prevents that.
		return (nextProps.burgessDiagramVisible !== this.props.burgessDiagramVisible || nextProps.ringStats !== this.props.ringStats);
	};
	
	componentWillMount () {};

	componentDidMount() {
		this.d3NestedPieChart.onHover = this.props.areaSelected.bind(this);
		this.d3NestedPieChart.onHoverOut = this.props.areaUnselected.bind(this);
		this.d3NestedPieChart.onGradeHover = this.props.gradeSelected.bind(this);
		this.d3NestedPieChart.onGradeHoverOut = this.props.gradeUnselected.bind(this);
		this.triggerIntro = this.triggerIntro.bind(this);
		if (this.props.ringStats) {
			this.d3NestedPieChart.update(this.refs.content, this.props.ringStats, this.props.gradeStats);
		}
	}

	componentDidUpdate () {
		this.d3NestedPieChart.destroy(this.refs.content);
		this.d3NestedPieChart.onHover = this.props.areaSelected.bind(this);
		this.d3NestedPieChart.onHoverOut = this.props.areaUnselected.bind(this);
		if (this.props.ringStats) {
			this.d3NestedPieChart.update(this.refs.content, this.props.ringStats, this.props.gradeStats);
		}
	}

	areaHover (selectedRingId, selectedGrade) {
		AppActions.ringAreaSelected(selectedRingId, selectedGrade);
	}

	triggerIntro (event) {
		this.props.toggleBurgessDiagram();
		this.props.triggerIntro(event);
	}

	render () {

		let burgessClassName = (this.props.burgessDiagramVisible) ? '' : 'hidden',
			  population1930 = (this.props.cityData.population_1930) ? this.props.cityData.population_1930.toLocaleString() : '',
			  population1940 = (this.props.cityData.population_1940) ? this.props.cityData.population_1940.toLocaleString() : '',
			  area = (this.props.area) ? Math.round(this.props.area * 100) / 100 + " sq mi" : '';

		return (
			<div className='stats'>
				<div className='stat-columns'>
				<ul className='left-stat'>
					<li>Population in 1930:</li> <li><span className='state-stat'>{ population1930 }</span></li>
					<li><span className='population-stat'>{ (Math.round(this.props.cityData.white_pop_1930 / this.props.cityData.population_1930 * 100 )) + '%' }</span> white</li><li><span className='population-stat'>{ (Math.round(this.props.cityData.black_pop_1930 / this.props.cityData.population_1930 * 100 )) + '%' }</span> African American</li>
				</ul>
				<ul className='right-stat'>	
					<li>Population in 1940:</li> <li><span className='state-stat'>{ population1940 }</span></li>
					<li><span className='population-stat'>{ (Math.round(this.props.cityData.white_pop_1940 / this.props.cityData.population_1940 * 100 )) + '%' }</span> white</li><li><span className='population-stat'>{ (Math.round(this.props.cityData.black_pop_1940 / this.props.cityData.population_1940 * 100 )) + '%' }</span> African American</li>
					
				</ul>
				<li>Area of city graded: <span className='state-stat'>{ area }</span></li>
				</div>
				<div className='panorama nestedpiechart'>
					<button className='intro-button' data-step='3' onClick={ this.triggerIntro }><span className='icon info'/></button>
					{ (this.props.ringStats) ?
						<div className='content' ref='content'></div> :
						<p>Area descriptions are not yet available but will be eventually.</p>
					}
					<img src='static/burgess.png' className={ burgessClassName } ref="burgessDiagram" id='burgessDiagram' />
				</div>
			</div>
		);
	}

	d3NestedPieChart = {
		// layout constants
		HEADER: 25,
		WIDTH: 250,
		DIAMETER: 250, // of the donut
		STATSHEIGHT: 30,
		DONUTWIDTH: 35,
		MARGIN: 10,

		update: function(node, ringstats, gradeStats) {
			if (Object.keys(ringstats).length === 0) { 
				this.destroy();
				return; 
			}

			let scope = this;	
			var color = function(i) { return ['#418e41', '#4a4ae4', '#f4f570', '#eb3f3f'][i]; };
			var colorBorder = function(i) { return ['#418e41', '#4a4ae4', '#A3A34B', '#eb3f3f'][i]; };

			var pie = d3.layout.pie()
				.value((d) => d.percent)
				.sort(null);
			var arc = d3.svg.arc()
				.innerRadius((d) => (d.data.ringId - 1.5) * scope.DONUTWIDTH)
				.outerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH);
			var arcBorder = d3.svg.arc()
				.innerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH)
				.outerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH);
			var percent = d3.format(",%");
	
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
			ringNodes
			  .selectAll('path')
			  .data((d) => pie(d.percents))
			  .enter().append('path')
			  .attr('transform', 'translate(' + (scope.WIDTH / 2) + ',' + (scope.HEADER * 2 + scope.MARGIN * 5 + scope.STATSHEIGHT + scope.DIAMETER / 2) + ')')
			  .attr('d', arc)
			  .attr('fill', (d,i) => color(i))
			  .attr('fill-opacity', (d) => d.data.opacity)
			  .attr('stroke', (d,i) => color(i))
			  .attr('stroke-width', 0)
			  .attr('class', (d) => 'sliceGrade' + d.data.grade)
			  .on("mouseover", function(d) {
				  d3.select(this)
					.transition()
					.duration(1000)
				  	.attr('fill-opacity', 1);
				  d3.select('#ring' + d.data.ringId + "grade" + d.data.grade)
				    .attr('opacity', 1);
				  scope.onHover(d.data.ringId, d.data.grade);
			  })
			  .on("mouseout", function(d) {
				  scope.onHoverOut();
				  d3.select(this)
				    .transition()
					.attr('fill-opacity', (d) => d.data.opacity);
				  d3.select('#ring' + d.data.ringId + "grade" + d.data.grade )
					.attr('opacity', 0);
			  });	

			// add thin stroke line for each slice of pie
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

			// add text for each slice of pie
			ringNodes
			  .selectAll('text')
			  .data((d) => pie(d.percents) )
			  .enter().append('text')
			  .attr('transform', (d) => 'translate(' + (arc.centroid(d)[0] + scope.WIDTH / 2) + ',' + (arc.centroid(d)[1] + scope.HEADER * 2 + scope.MARGIN * 5 + scope.STATSHEIGHT + scope.DIAMETER / 2) + ')')
			  .attr('text-anchor', "middle")
			  .style('font', "11px Arial")
			  .attr('dy', 5.5)
			  .attr('fill', (d) => (d.data.grade == 'C') ? 'black' : 'white')
			  .attr('opacity', 0)
			  .attr('id', (d) => 'ring' + d.data.ringId + 'grade' + d.data.grade)
			  .attr('pointer-events', 'none')
			  .text((d) => percent(d.value));

			ringNodes
			  .selectAll('rect')
			  .data(ringstats)
			  .enter().append('rect')
			  .attr('class', (d,i,j) => 'barGrade' + d.percents[j].grade)
			  .attr('height', scope.STATSHEIGHT)
			  .attr('width', (d, i, j) => Math.round(d.percents[j].overallPercent * scope.WIDTH))
			  .attr('opacity', .7)
			  .attr('y', scope.HEADER + scope.MARGIN)
			  .attr('x', (d, i, j) => {
				let x = 0;
				for (let j0 = 0; j0 <= 3; j0++) {
					for (let i0 = 0; i0 <= 3; i0++) {
						if (ringstats[j0].percents[i0].grade < d.percents[j].grade || (ringstats[j0].percents[i0].grade == d.percents[j].grade && ringstats[j0].percents[i0].ringId < d.percents[j].ringId)) {
							x+= Math.round(ringstats[j0].percents[i0].overallPercent * scope.WIDTH);
						}
					}
				}
				return x;
			  })
			  .attr('fill', (d,i,j) => color(j))
			  .on("mouseover", function(d,i,j) {
				let grade = ['A','B','C','D'][j];
				d3.selectAll("rect.barGrade" + grade)
				  .transition()
				  .duration(1000)
				  .attr('opacity', 1);
				/* d3.selectAll(".sliceGrade" + grade)
				  .transition()
				  .duration(1000)
				  .attr('stroke-width', 5); */
				scope.onGradeHover(grade);
			  }).
			  on("mouseout", function(d,i,j) {
				let grade = ['A','B','C','D'][j];
				d3.selectAll("rect.barGrade" + grade)
				  .transition()
				  .attr('opacity', .7);
				d3.selectAll(".sliceGrade" + grade)
				  .transition()
				  .attr('stroke-width', 0);
				scope.onGradeHoverOut();
			  });

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
			  .attr('y', scope.HEADER + scope.MARGIN + 20)
			  .attr("text-anchor", "middle")
			  .attr("font-family", "sans-serif")
			  .attr("font-size", "10px")
			  .attr('fill', (d) => (d.grade == 'C') ? 'black' : 'white')
			  .classed('overallPercent', true)
			  .text((d) => percent(d.percent));

			ringNodes
			  .append('text')
			  .attr('x', scope.WIDTH / 2)
			  .attr('y', scope.HEADER)
			  .attr("text-anchor", "middle")
			  .text('Grading in Terms of Area');

			ringNodes
			  .append('text')
			  .attr('x', scope.WIDTH / 2)
			  .attr('y', scope.HEADER + scope.MARGIN * 4 + scope.STATSHEIGHT)
			  .attr("text-anchor", "middle")
			  .text('Grading & Density Outward');

			ringNodes
			  .append('text')
			  .attr('x', scope.WIDTH / 2)
			  .attr('y', scope.HEADER * 2 + scope.MARGIN * 4 + scope.STATSHEIGHT)
			  .attr("text-anchor", "middle")
			  .text('from City Center');

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
