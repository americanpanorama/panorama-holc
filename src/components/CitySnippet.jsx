import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';
import * as d3 from 'd3';

export default class CitySnippet extends React.Component {
	// property validation
	static propTypes = {
		cityData: PropTypes.object,
		displayState: PropTypes.bool,
		onCityClick: PropTypes.func
	};

	constructor () {
		super();
	}

	shouldComponentUpdate (nextProps) {
		return (nextProps.cityData.city !== this.props.cityData.city);
	} 

	componentWillMount () {}

	componentDidMount() {
		if (this.props.cityData.hasPolygons) {
			this.d3BarChart.update(this.refs.barchart, this.parsePercents());
		}
	}

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
			<div 
				className='city-snippet' 
				onClick={ this.props.onCityClick } 
				id={ this.props.cityData.ad_id }
			>
				{ (this.props.cityData.hasADs && this.props.cityData.hasImages) ?
					<h4>area descriptions data &amp; scans</h4> : 
					''
				}

				{ (!this.props.cityData.hasADs && this.props.cityData.hasImages) ?
					<h4>area descriptions scans</h4> : 
					''
				}

				{ (this.props.cityData.hasADs && !this.props.cityData.hasImages) ?
					<h4>area descriptions data</h4> : 
					''
				}

				{ (this.props.cityData.hasPolygons) ?
					<div className='barchart' ref='barchart'></div> :
					null
				}

				<h3 >{this.props.cityData.name + ((this.props.displayState) ? ', ' + this.props.cityData.state : '') }</h3>
				{ (this.props.cityData.displayPop && this.props.cityData.displayPop[1940].total) ?
					<div className='populationStats'><span className='catName'>Population (1940):</span> <span className='subcatData'>{ this.props.cityData.displayPop[1940].total.toLocaleString() }</span></div> :
					''
				}
				<ul>
				{ this.props.cityData.displayPop && this.props.cityData.displayPop[1940].percents.map((pop) => {
					if (Math.round(pop.proportion * 100) !== -1) {
						return <li key={ 'pop1940' + pop.label.replace(/ /g,'') }>{ Math.round(pop.proportion * 100) + '% ' + pop.label }</li>;
					}
				})}
				</ul>

			</div>
		);
	}

	d3BarChart = {
		// layout constants
		WIDTH: 90,
		HEIGHT: 40,
		MARGIN: 24,

		update: function(node, gradeStats, width = false) {
			if (Object.keys(gradeStats).length === 0) { 
				this.destroy();
				return; 
			}

			let scope = this;

			if (width) {
				//scope.WIDTH = width;
			}

			var color = function(i) { return ['#418e41', '#4a4ae4', '#f4f570', '#eb3f3f'][i]; };
			var colorBorder = function(i) { return ['#418e41', '#4a4ae4', '#A3A34B', '#eb3f3f'][i]; };
			var colorGrade = function(grade) {
				let gradeColors = {'A':'#418e41','B':'#4a4ae4','C':'#CCCC00','D':'#eb3f3f'};
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
				.attr('width', scope.WIDTH)
				.attr('height', scope.HEIGHT + scope.MARGIN)
				.attr('id', 'barchart')
				.selectAll('g')
				.data(gradeStats)
				.enter().append('g');

			theChart
			  .selectAll('rect')
			  .data(gradeStats)
			  .enter().append('rect')
			  //.attr('class', (d,i,j) => 'areaBar barGrade' + d.percents[j].grade + ' ring' + (i + 1))
			  .attr('height', scope.HEIGHT/4 - 4)
			  .attr('width', (d) => d.width)
			  .attr('opacity', .7)
			  .attr('y', (d,i) => scope.MARGIN + scope.HEIGHT/4 * i)
			  .attr('x', (d) => scope.WIDTH - d.width)
			  .attr('fill', (d) => colorGrade(d.grade));
		}, 

		destroy: function (node) {
			d3.select(node).html('');
		} 
	}

}