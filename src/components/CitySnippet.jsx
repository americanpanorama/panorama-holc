import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';
import * as d3 from 'd3';

export default class Downloader extends React.Component {
	// property validation
	static propTypes = {
		cityData: PropTypes.object
	};

	constructor () {

		super();

	}

	componentWillMount () {}

	componentDidMount() {
		if (this.props.cityData.hasPolygons) {
			this.d3Chart.update(this.refs.barchart, this.parsePercents());
		}
	}

	componentWillUnmount () {}

	componentDidUpdate () {}

	parsePercents () {

		return (this.props.cityData.hasPolygons) ? [
			{'grade': 'A', 'percent': this.props.cityData.area.a / this.props.cityData.area.total },
			{'grade': 'B', 'percent': this.props.cityData.area.b / this.props.cityData.area.total },
			{'grade': 'C', 'percent': this.props.cityData.area.c / this.props.cityData.area.total },
			{'grade': 'D', 'percent': this.props.cityData.area.d / this.props.cityData.area.total }
		] : false;
	}

	render () {
		return (
			<div className='city-snippet'>
				<h3>{this.props.cityData.city}</h3>
				<div><span className='catName'>Population (1940):</span> <span className='subcatData'>{ this.props.cityData.population_1940.toLocaleString() }</span></div>
				{ this.render_population_details() }
				{ (this.props.cityData.hasPolygons) ?
					<div className='barchart' ref='barchart'></div> :
					null
				}
			</div>
		);
	}

	render_population_details () {
		let CD = this.props.cityData,
			aggregated_pop = CD.white_pop_1940 + CD.black_pop_1940 + CD.asian_pacific_islander_1940 + CD.american_indian_eskimo_1940;
		if (aggregated_pop == 0) {
			return false;
		} else {
			let proportions = [
				{
					'label': 'white',
					'proportion': CD.white_pop_1940 / aggregated_pop
				},
				{
					'label': 'African American',
					'proportion': CD.black_pop_1940 / aggregated_pop
				},
				{
					'label': 'Asian American',
					'proportion': CD.asian_pacific_islander_1940 / aggregated_pop
				},
				{
					'label': 'Native American',
					'proportion': CD.american_indian_eskimo_1940 / aggregated_pop
				}
			];
			proportions.sort((a,b) => a.proportion < b.proportion);
			return <ul className='city-snippet'>
				{ proportions.map((pop) => {
					if (Math.round(pop.proportion * 100) !== 0) {
						return <li key={ 'pop1940' + pop.label.replace(/ /g,'') }>{ Math.round(pop.proportion * 100) + '% ' + pop.label }</li>;
					}
				})}
				</ul>;
		}
	}

	d3Chart = {
		// layout constants
		WIDTH: 250,
		HEIGHT: 30,
		MARGIN: 20,

		update: function(node, gradeStats) {
			if (Object.keys(gradeStats).length === 0) { 
				this.destroy();
				return; 
			}

			let scope = this;
			var color = function(i) { return ['#418e41', '#4a4ae4', '#f4f570', '#eb3f3f'][i]; };
			var colorBorder = function(i) { return ['#418e41', '#4a4ae4', '#A3A34B', '#eb3f3f'][i]; };
			var colorGrade = function(grade) {
				let gradeColors = {'A':'#418e41','B':'#4a4ae4','C':'#f4f570','D':'#eb3f3f'};
				return gradeColors[grade];
			};

			var percent = d3.format(',%');
			var width = d3.scale.linear()
				.rangeRound([0, scope.WIDTH]);

			let x = 0;
			gradeStats.forEach((d, i) => {
				gradeStats[i] = { x: x, width: width(d.percent), percent: d.percent, grade: d.grade };
				x += width(d.percent);
			});

			let theChart = d3.select(node)
				.append('svg')
				.attr('width', scope.WIDTH + scope.MARGIN)
				.attr('height', scope.HEIGHT)
				.attr('id', 'barchart')
				.selectAll('g')
				.data(gradeStats)
				.enter().append('g');

			theChart
			  .selectAll('rect')
			  .data(gradeStats)
			  .enter().append('rect')
			  //.attr('class', (d,i,j) => 'areaBar barGrade' + d.percents[j].grade + ' ring' + (i + 1))
			  .attr('height', scope.HEIGHT)
			  .attr('width', (d) => d.width)
			  .attr('opacity', .7)
			  .attr('y', 0)
			  .attr('x', (d) => d.x + scope.MARGIN)
			  .attr('fill', (d) => colorGrade(d.grade));

			theChart
			  .selectAll('text')
			  .data(gradeStats)
			  .enter().append('text')
			  .attr('x', (d) => d.x + d.width / 2 + scope.MARGIN)
			  .attr('y', 20)
			  .attr('text-anchor', 'middle')
			  .attr('font-family', 'sans-serif')
			  .attr('font-size', '10px')
			  .attr('fill', (d) => (d.grade == 'C') ? 'black' : 'white')
			  .text((d) => (d.percent > 0.03) ? percent(d.percent) : '');
		}, 

		destroy: function (node) {
			d3.select(node).html('');
		} 
	}
}