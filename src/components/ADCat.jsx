import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';
import CityStore from '../stores/CityStore';


export default class ADCat extends React.Component {

	// property validation
	static propTypes = {
		
	};

	// (instead of ES5-style getDefaultProps)
	static defaultProps = {
		catNum: undefined,
		catLetter: undefined
	};

	constructor () {

		super();

		// bind handlers
		let handlers = ['render19370826_5c', 'render19370826_5c', 'render19370203_5d', 'render19370826_5d', 'render19370826_5g', 'render19370203_5g','render19370203_8a','render19370826_8a','render19370203_8b','render19370826_8b','render19370203_8c','render19370826_8c'];
		handlers.map(handler => { this[handler] = this[handler].bind(this); });

	}

	componentWillMount () {}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidUpdate () {}

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
	alphanumCase (a, b) {
		function chunkify(t) {
			var tz = new Array();
			var x = 0, y = -1, n = 0, i, j;
			while (i = (j = t.charAt(x++)).charCodeAt(0)) {
				var m = (i == 46 || (i >=48 && i <= 57));
				if (m !== n) {
					tz[++y] = "";
					n = m;
				}
				tz[y] += j;
			}
			return tz;
		}

		var aa = chunkify(a.toLowerCase());
		var bb = chunkify(b.toLowerCase());		
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

	renderGrade(grade) {
		let possibleFunction = this['render' + CityStore.getFormId() + '_' + this.props.catNum + ((this.props.catLetter) ? this.props.catLetter : '')],
			categoryData = CityStore.getADsByCat(this.props.catNum, this.props.catLetter);
		return (
			<div>
				<div className={'grade-header' + grade}><h2>{ grade }</h2></div>
				<ul className='area_description' ref={ 'cat' + grade }>
					{ Object.keys(categoryData).sort(this.alphanumCase).map(neighborhoodId => {
						if (grade == neighborhoodId.charAt(0)) {
							return (
								<li key={ 'cat' + grade + neighborhoodId }>
									<span onClick={ this.props.onNeighborhoodClick } id={ neighborhoodId }>{ neighborhoodId }</span>: 
									{ (typeof(possibleFunction) === 'function') ? possibleFunction(categoryData[neighborhoodId]) : this.renderDatum(categoryData[neighborhoodId]) }
								</li>
							);
						}
					})}
				</ul>
			</div>
		);
	}

	renderDatum(datum) {
		return (
			<span>{ (datum) ? <span className='subcatData'>{ datum }</span> : <span className='empty'>empty</span> }</span>
		);
	}

	render19370203_5c(data) {
		return (
			<span>
				{ this.renderDatum(data[1])}; { this.renderDatum(data[2])}
			</span>
		);
	}

	render19370826_5c = this.render19370203_5c;
	render19370203_5d = this.render19370203_5c;
	render19370826_5d = this.render19370203_5c;

	render19370203_5g(data) {
		return (
			<span>
				Population is increasing { this.renderDatum(data[1])}; decreasing { this.renderDatum(data[2])}; static.
			</span>
		);
	}

	render19370826_5g = this.render19370203_5g;

	render19370203_8a(data) {
		return (
			<span>{ this.renderDatum(data) }%</span>
		);
	}

	render19370826_8a = this.render19370203_8a;
	render19370203_8b = this.render19370203_8a;
	render19370826_8b = this.render19370203_8a;
	render19370203_8c = this.render19370203_8a;
	render19370826_8c = this.render19370203_8a;

	render () {

		let previousCat = CityStore.getPreviousCatIds(this.props.catNum, this.props.catLetter),
			nextCat = CityStore.getNextCatIds(this.props.catNum, this.props.catLetter);

		return (
			<div>
				<h3>{ CityStore.getCatTitle(this.props.catNum, this.props.catLetter) }</h3>
				
				<ul>
					<li>{ (previousCat) ? <span onClick={ this.props.onCategoryClick } id={ CityStore.getCategoryString(...previousCat) }>{ CityStore.getCatTitle(...previousCat) }</span> : '' }</li>
					<li>{ (nextCat) ? <span onClick={ this.props.onCategoryClick } id={ CityStore.getCategoryString(...nextCat) }>{ CityStore.getCatTitle(...nextCat) }</span> : '' }</li>
				</ul>

				{ this.renderGrade('A') }
				{ this.renderGrade('B') }
				{ this.renderGrade('C') }
				{ this.renderGrade('D') }
			</div>
		);
	}

}