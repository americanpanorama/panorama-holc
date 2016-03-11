import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import * as d3 from 'd3';
import { AppActions } from '../utils/AppActionCreator';

export default class CityStats extends React.Component {

	// property validation
	static propTypes = {
		ringStats: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
		areaSelected: PropTypes.func,
		areaUnselected: PropTypes.func,
		triggerIntro: PropTypes.func,
		toggleBurgessDiagram: PropTypes.func,
		burgessDiagramVisible: PropTypes.bool
	};

	// (instead of ES5-style getDefaultProps)
	static defaultProps = {
		name: '',
		ringStats: {
			1: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'density': 0},
			2: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'density': 0},
			3: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'density': 0},
			4: {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'density': 0}
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
		this.triggerIntro = this.triggerIntro.bind(this);
		if (this.props.ringStats) {
			this.d3NestedPieChart.updateold(this.refs.content, this.props.ringStats);
		}
	}

	componentDidUpdate () {
		this.d3NestedPieChart.destroy(this.refs.content);
		this.d3NestedPieChart.onHover = this.props.areaSelected.bind(this);
		this.d3NestedPieChart.onHoverOut = this.props.areaUnselected.bind(this);
		if (this.props.ringStats) {
			this.d3NestedPieChart.updateold(this.refs.content, this.props.ringStats);
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
		let burgessClassName = (this.props.burgessDiagramVisible) ? '' : 'hidden';

		return (
			<div className='panorama nestedpiechart'>
				<button className='intro-button' data-step='3' onClick={ this.triggerIntro }><span className='icon info'/></button>
				{ (this.props.ringStats) ?
					<div className='content' ref='content'></div> :
					<p>Area descriptions are not yet available but will be eventually.</p>
				}
				<img src='static/burgess.png' className={ burgessClassName } ref="burgessDiagram" id='burgessDiagram' />
			</div>
		);
	}

	d3NestedPieChart = {
		that: this,

		// layout constants
		WIDTH: 250,
		HEIGHT: 250,
		DONUTWIDTH: 35,

		ringNodes: d3.select(this.refs.content)
			.append('svg')
			.attr('width', this.WIDTH)
			.attr('height', this.HEIGHT),
	
		update: function (node, ringstats) {	
			if (Object.keys(ringstats).length === 0) { 
				this.destroy();
				return; 
			}
			
			let scope = this;	
	
			// format ringstats data
			let formattedStats = [],
				  opacities = [];
			for (let ringId = 1; ringId <= 4; ringId++) {
				formattedStats.push({ percents: [ { percent: ringstats[ringId].A, ringId: ringId, opacity: ringstats[ringId].density, grade: "A" }, { percent: ringstats[ringId].B, ringId: ringId, opacity: ringstats[ringId].density, grade: "B" }, { percent: ringstats[ringId].C, ringId: ringId, opacity: ringstats[ringId].density, grade: "C" }, { percent: ringstats[ringId].D, ringId: ringId, opacity: ringstats[ringId].density, grade: "D" } ] });
			}
	
			var color = function(i) { return ['green', 'blue', 'yellow', 'red'][i]; };
			var pie = d3.layout.pie()
				.value((d) => d.percent)
				.sort(null);
			var arc = d3.svg.arc()
				.innerRadius((d) => (d.data.ringId - 1.5) * scope.DONUTWIDTH)
				.outerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH);
			var arcover = d3.svg.arc()
				.innerRadius((d) => (d.data.ringId - 1.5) * scope.DONUTWIDTH)
				.outerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH + 4);
	
			// <g> for each ring
			scope.ringNodes
				.selectAll('g')
				.data(formattedStats)
				.enter().append('g')
				.attr('transform', 'translate(' + (scope.WIDTH / 2) + ',' + (scope.HEIGHT / 2) + ')');
	
			// path for each pie piece
			scope.ringNodes
			  .selectAll('path')
			  .data((d) => pie(d.percents) )
			  .enter().append('path')
			  .attr('d', arc)
			  .attr('fill', (d,i) => color(i))
			  .attr("stroke", (d,i) => color(i))
			  .attr("stroke-width", 0)
			  .attr("stroke-opacity", 1)
			  .attr('fill-opacity', (d) => d.data.opacity)
			  .on("mouseover", function(d) {
				d3.select(this)
					.transition()
					.duration(500)
					.attr('d', arcover)
				  	.attr("stroke-width", 0)
				  	.attr('fill-opacity', (d) => d.data.opacity * 6);
				scope.onHover(d.data.ringId, d.data.grade);
			  })
			  .on("mouseout", function(d) {
				console.log("left");
				scope.onHoverOut();
				d3.select(this)
					.transition()
					.attr('d', arc)
					.attr("stroke-width", 0)
					.attr('fill-opacity', (d) => d.data.opacity);
			  });	
		},
	
		/**
		 * Logic for updating d3 component with new data.
		 *
	 	 * @param  {Node}    HTMLElement to which d3 will attach
	 	 * @param  {Object}  RingStats (TODO: document expected format)
	 	 */
		updateold: function(node, ringstats) {

			if (Object.keys(ringstats).length === 0) { 
				this.destroy();
				return; 
			}
			
			let scope = this;	
	
			// format ringstats data
			let formattedStats = [],
				  opacities = [];
			for (let ringId = 1; ringId <= 4; ringId++) {
				formattedStats.push({ percents: [ { percent: ringstats[ringId].A, ringId: ringId, opacity: ringstats[ringId].density, grade: "A" }, { percent: ringstats[ringId].B, ringId: ringId, opacity: ringstats[ringId].density, grade: "B" }, { percent: ringstats[ringId].C, ringId: ringId, opacity: ringstats[ringId].density, grade: "C" }, { percent: ringstats[ringId].D, ringId: ringId, opacity: ringstats[ringId].density, grade: "D" } ] });
			}
	
			var color = function(i) { return ['green', 'blue', 'yellow', 'red'][i]; };
			var pie = d3.layout.pie()
				.value((d) => d.percent)
				.sort(null);
			var arc = d3.svg.arc()
				.innerRadius((d) => (d.data.ringId - 1.5) * scope.DONUTWIDTH)
				.outerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH);
			var arcover = d3.svg.arc()
				.innerRadius((d) => (d.data.ringId - 1.5) * scope.DONUTWIDTH)
				.outerRadius((d) => (d.data.ringId - 0.5) * scope.DONUTWIDTH + 4);
	
			// <g> for each ring
			let ringNodes = d3.select(node)
				.append('svg')
				.attr('width', scope.WIDTH)
				.attr('height', scope.HEIGHT)
				.attr('id', 'piechart')
				.selectAll('g')
				.data(formattedStats)
				.enter().append('g')
				.attr('transform', 'translate(' + (scope.WIDTH / 2) + ',' + (scope.HEIGHT / 2) + ')');
	
			// path for each pie piece
			ringNodes
			  .selectAll('path')
			  .data((d) => pie(d.percents) )
			  .enter().append('path')
			  .attr('d', arc)
			  .attr('fill', (d,i) => color(i))
			  .attr("stroke", (d,i) => color(i))
			  .attr("stroke-width", 0)
			  .attr("stroke-opacity", 1)
			  .attr('fill-opacity', (d) => d.data.opacity)
			  .on("mouseover", function(d) {
				d3.select(this)
					.transition()
					.duration(500)
					.attr('d', arcover)
				  	.attr("stroke-width", 0)
				  	.attr('fill-opacity', (d) => d.data.opacity * 6);
				scope.onHover(d.data.ringId, d.data.grade);
			  })
			  .on("mouseout", function(d) {
				scope.onHoverOut();
				d3.select(this)
					.transition()
					.attr('d', arc)
					.attr("stroke-width", 0)
					.attr('fill-opacity', (d) => d.data.opacity);
			  });	
		},

		onHover: function() {
			// bound in componentDidMount to the areaSelected method of App (passed in as a props)
		},

		onHoverOut: function() {
			// bound in componentDidMount to the areaUnselected metthod of App
		},
	
		destroy: function (node) {
			d3.select(node).html('');
		}
	
	
	}

};
