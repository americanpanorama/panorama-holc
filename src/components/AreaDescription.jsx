import React, { PropTypes } from 'react';
import ExampleStore from '../stores/ExampleStore';
import { AppActionTypes } from '../utils/AppActionCreator';


export default class AreaDescription extends React.Component {

	// property validation
	static propTypes = {
		areaData: PropTypes.object
	};

	// (instead of ES5-style getDefaultProps)
	static defaultProps = {
		areaDescriptions: {}
	};

	constructor () {

		super();

	}

	componentWillMount () {

		//

	}

	componentDidMount () {

		// Listen for data changes

	}

	componentWillUnmount () {


	}

	componentDidUpdate () {

		//

	}

	render () {

		if (typeof(this.props.areaData) == 'undefined' || typeof(this.props.areaData.areaDesc) == 'undefined') {
			return false;
		}

		console.log(this.props.formId);

		switch(this.props.formId) {
			case '19370203':
			case '19370826':
				return this.renderNSForm8_19370203();
			case '19371001':
				return this.renderNSForm8_19371001();
		}

	}

	renderOLD () {

		if (typeof(this.props.areaData.areaDesc) == 'undefined') {
			return false;
		}

		console.log(this.props.areaData);

		return (
			<div className='area_description'>
				<div id="neighborhood">
					<h2 className="data_title">Neighborhood</h2>
					<div id="neighborhood_name"></div>
					<div id="neighborhood_location"></div>
					<div id="neighborhood_id"></div>
					<div id="holc_grade">{ this.props.areaData.holc_grade }</div>
				</div>
				<div className='area_desc'>
					<h2 className='data_title'>Area Description</h2>
					<ul className="area_data">
						{ Object.keys(this.props.areaData.areaDesc).map((catNum) => {
							let catData = this.props.areaData.areaDesc[catNum];
							let subcats = null;
							if (!catData.hasOwnProperty("question")) {
								subcats = Object.keys(this.props.areaData.areaDesc[catNum]).sort().map((subcatLetter) => {
									return (
										<li key={ catNum + subcatLetter }>{ subcatLetter }. { catData[subcatLetter].question }:  <span className='answer'>{ catData[subcatLetter].answer }</span></li>
									)
								});
							}
							return (
								<li key={ catNum }>
									<span className="category">{ catNum }. { catData.question }</span>  <span className='answer'>{ catData.answer }</span>
									<ul>{ subcats }</ul>
								</li>
							)
						}) }
					</ul>
				</div>
			</div>
		);

	}

	renderNSForm8_19370203() {
		console.log(this.props.areaData.areaDesc);
		let AD = this.props.areaData.areaDesc;
		return (
			<ul className='area_description NSForm8'>
				<li>
					<span className='catNum'>1</span>
					<span className='subcatName'>Name of City</span>
					<span className='subcatData'>{ (AD[1] && AD[1][1] ) ? AD[1][1] : <span className='empty'>empty</span> }</span>
					<span className='subcatName'> Security Grade </span>
					<span className='subcatData'>{ (AD[1] && AD[1][2] ) ? AD[1][2] : <span className='empty'>empty</span> }</span>
					<span className='subcatName'> Area No. </span>
					<span className='subcatData'>{ (AD[1] && AD[1][3] ) ? AD[1][3] : <span className='empty'>empty</span> }</span>
				</li>
				{ this.renderSimpleCategory(2, 'Description of Terrain') }
				{ this.renderSimpleCategory(3, 'Favorable Influences') }
				{ this.renderSimpleCategory(4, 'Detrimental Influences') }
				<li>
					<span className='catNum'>5</span>
					<span className='catName'>Inhabitants</span>
					<ul>
						{ this.renderSimpleSubcategory(5, 'a', 'Type') }
						{ this.renderSimpleSubcategory(5, 'b', 'Estimated annual family income') }
						<li>
							<span className='catLetter'>c</span>
							<span className='subcatName'>Foreign-born</span>
							<span className='subcatData'>{ (AD[5] && AD[5]['c']['1'] ) ? AD[5]['c']['1'] : <span className='empty'>empty</span> }; { (AD[5] && AD[5]['c']['2'] ) ? AD[5]['c']['2'] : <span className='empty'>empty</span> }</span>
						</li>
						<li>
							<span className='catLetter'>d</span>
							<span className='subcatName'>Negro</span>
							<span className='subcatData'>{ (AD[5] && AD[5]['d']['1'] ) ? AD[5]['d']['1'] : <span className='empty'>empty</span> }; { (AD[5] && AD[5]['d']['2'] ) ? AD[5]['d']['2'] : <span className='empty'>empty</span> }</span>
						</li>
						{ this.renderSimpleSubcategory(5, 'e', 'Infiltration of') }
						{ this.renderSimpleSubcategory(5, 'f', 'Relief families') }
						<li>
							<span className='catLetter'>g</span>
							<span className='subcatName'>Population is increasing</span>
							<span className='subcatData'>{ (AD[5] && AD[5]['g']['1'] ) ? AD[5]['g']['1'] : <span className='empty'>empty</span> }</span>
							<span className='subcatName'>; decreasing</span>
							<span className='subcatData'>{ (AD[5] && AD[5]['g']['2'] ) ? AD[5]['g']['2'] : <span className='empty'>empty</span> }</span>; 
							<span className='subcatName'>; static</span>
						</li>
						
					</ul>
				</li>
				<li>
					<span className='catNum'>6</span>
					<span className='catName'>Buildings</span>
					<ul>
						{ this.renderSimpleSubcategory(6, 'a', 'Type or Types') }
						{ this.renderSimpleSubcategory(6, 'b', 'Type of construction') }
						{ this.renderSimpleSubcategory(6, 'c', 'Average age') }
						{ this.renderSimpleSubcategory(6, 'd', 'Repair') }
					</ul>
				</li>
				<li>
					<span className='catNum'>7</span>
					<span className='catName'>History</span>
					<table>
						<thead>
							<tr>
								<th>Sales Values</th>
							</tr>
							<tr>
								<th>Year</th>
								<th>Range</th>
								<th>Predominating</th>
								<th>%</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th>1929 level</th>
								<td>{ (AD[7] && AD[7][1] ) ? AD[7][1] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][2] ) ? AD[7][2] : <span className='empty'>empty</span> }</td>
								<td>100%</td>
							</tr>
							<tr>
								<th>{ AD[7][5] } level</th>
								<td>{ (AD[7] && AD[7][6] ) ? AD[7][6] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][7] ) ? AD[7][7] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][8] ) ? AD[7][8] : <span className='empty'>empty</span> }</td>
							</tr>
							<tr>
								<th>{ AD[7][12] }  level</th>
								<td>{ (AD[7] && AD[7][13] ) ? AD[7][13] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][14] ) ? AD[7][14] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][15] ) ? AD[7][15] : <span className='empty'>empty</span> }</td>
							</tr>
						</tbody>
					</table>

					<table>
						<thead>
							<tr>
								<th>Rental Values</th>
							</tr>
							<tr>
								<th>Year</th>
								<th>Range</th>
								<th>Predominating</th>
								<th>%</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th>1929 level</th>
								<td>{ (AD[7] && AD[7][3] ) ? AD[7][3] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][4] ) ? AD[7][4] : <span className='empty'>empty</span> }</td>
								<td>100%</td>
							</tr>
							<tr>
								<th>{ AD[7][5] } level</th>
								<td>{ (AD[7] && AD[7][9] ) ? AD[7][9] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][10] ) ? AD[7][10] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][11] ) ? AD[7][11] : <span className='empty'>empty</span> }</td>
							</tr>
							<tr>
								<th>{ AD[7][12] }  level</th>
								<td>{ (AD[7] && AD[7][16] ) ? AD[7][16] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][17] ) ? AD[7][17] : <span className='empty'>empty</span> }</td>
								<td>{ (AD[7] && AD[7][18] ) ? AD[7][18] : <span className='empty'>empty</span> }</td>
							</tr>
						</tbody>
					</table>
					<div>
						<span className='subcatName'>Peak Sales values occurred in</span>
						<span className='subcatData'>{ (AD[7] && AD[7][19] ) ? AD[7][19] : <span className='empty'>empty</span> }</span>
						<span className='subcatName'> and were </span>
						<span className='subcatData'>{ (AD[7] && AD[7][20] ) ? AD[7][20] : <span className='empty'>empty</span> }</span>
						<span className='subcatName'>% of the 1929 level.</span>
					</div>
					<div>
						<span className='subcatName'>Peak rental values occurred in</span>
						<span className='subcatData'>{ (AD[7] && AD[7][21] ) ? AD[7][21] : <span className='empty'>empty</span> }</span>
						<span className='subcatName'> and were </span>
						<span className='subcatData'>{ (AD[7] && AD[7][22] ) ? AD[7][22] : <span className='empty'>empty</span> }</span>
						<span className='subcatName'>% of the 1929 level.</span>
					</div>
				</li>
				<li>
					<span className='catNum'>8</span>
					<span className='catName'>Occupancy</span>
					<ul>
						{ this.renderSimpleSubcategory(8, 'a', 'Land') }
						{ this.renderSimpleSubcategory(8, 'b', 'Dwelling units') }
						{ this.renderSimpleSubcategory(8, 'c', 'Home Owners') }
					</ul>
				</li>
				<li>
					<span className='catNum'>9</span>
					<span className='catName'>Sales Demand</span>
					<ul>
						{ this.renderSimpleSubcategory(9, 'a', '') }
						{ this.renderSimpleSubcategory(9, 'b', '') }
						{ this.renderSimpleSubcategory(9, 'c', 'Activity is') }
					</ul>
				</li>
				<li>
					<span className='catNum'>10</span>
					<span className='catName'>Rental Demand</span>
					<ul>
						{ this.renderSimpleSubcategory(10, 'a', '') }
						{ this.renderSimpleSubcategory(10, 'b', '') }
						{ this.renderSimpleSubcategory(10, 'c', 'Activity is') }
					</ul>
				</li>
				<li>
					<span className='catNum'>11</span>
					<span className='catName'>New Construction</span>
					<ul>
						{ this.renderSimpleSubcategory(11, 'a', 'Types') }
						{ this.renderSimpleSubcategory(11, 'b', 'Amount last year') }
					</ul>
				</li>
				<li>
					<span className='catNum'>12</span>
					<span className='catName'>Availability of Mortgage Funds</span>
					<ul>
						{ this.renderSimpleSubcategory(12, 'a', 'Home purchase') }
						{ this.renderSimpleSubcategory(12, 'b', 'Home building') }
					</ul>
				</li>
				{ this.renderSimpleCategory(13, 'Trend of Desireability Next 10-15 Years') }
				{ this.renderSimpleCategory(14, 'Clarifying Remarks') }
				{ this.renderSimpleCategory(15, 'Information for this form was obtained from') }
				
			</ul>
		);
	}

	renderNSForm8_19371001() {
		console.log(this.props.areaData.areaDesc);
		let AD = this.props.areaData.areaDesc;
		return (
			<ul className='area_description NSForm8'>
				<li>
					<span className='catNum'>1</span>
					<span className='catName'>Area Characteristics</span>
					<ul>
						{ this.renderSimpleSubcategory(1, 'a', 'Description of Terrain') }
						{ this.renderSimpleSubcategory(1, 'b', 'Favorable Influences') }
						{ this.renderSimpleSubcategory(1, 'c', 'Detrimental Influences') }
						{ this.renderSimpleSubcategory(1, 'd', 'Percentage of land improved') }
						{ this.renderSimpleSubcategory(1, 'e', 'Trend of desireability next 10-15 yrs.') }
					</ul>
				</li>
				<li>
					<span className='catNum'>2</span>
					<span className='catName'>Inhabitants</span>
					<ul>
						{ this.renderSimpleSubcategory(2, 'a', 'Occupation') }
						{ this.renderSimpleSubcategory(2, 'b', 'Estimated Annual Family Income') }
						<li>
							<span className='catLetter'>c</span>
							<span className='catName'>Foreign-born families</span>
							<span className='subcatData'>{ this.renderSimpleData(2, 'c', 1) }</span>
							<span className='catName'>%;</span>
							<span className='subcatData'> { this.renderSimpleData(2, 'c', 2) }</span>
							<span className='catName'>  predominating</span>
						</li>
						<li>
							<span className='catLetter'>d</span>
							<span className='catName'>Negro</span>
							<span className='subcatData'>{ this.renderSimpleData(2, 'd', 1) }</span>
							<span className='catName'>%;</span>
							<span className='subcatData'> { this.renderSimpleData(2, 'd', 2) }</span>
							<span className='catName'>  predominating</span>
						</li>
						{ this.renderSimpleSubcategory(2, 'e', 'Infiltration of') }
						{ this.renderSimpleSubcategory(2, 'f', 'Relief families') }
						<li>
							<span className='catLetter'>g</span>
							<span className='catName'>Population is increasing</span>
							<span className='subcatData'> { this.renderSimpleData(2, 'g', 1) }</span>
							<span className='catName'>; decreasing</span>
							<span className='subcatData'> { this.renderSimpleData(2, 'g', 2) }</span>
							<span className='catName'>; static</span>
							<span className='subcatData'> { this.renderSimpleData(2, 'g', 3) }</span>
						</li>
					</ul>
				</li>
				<li>
					<span className='catNum'>3</span>
					<span className='catName'>Buildings</span>
				</li>
				<li>
					<span className='catNum'>4</span>
					<span className='catName'>Availability of Mortgage Funds</span>
					<ul>
						{ this.renderSimpleSubcategory(4, 'a', 'Home purchase') }
						{ this.renderSimpleSubcategory(4, 'b', 'Home building') }
					</ul>
				</li>
				{ this.renderSimpleCategory(5, 'Clarifying Remarks') }
				<li>
					<span className='catNum'>6</span>
					<span className='catName'>Name and Location</span>
					<span className='subcatData'>{ (AD[6] && AD[6][1] ) ? AD[6][1] : <span className='empty'>empty</span> }</span>
					<span className='catName'>Security Grade</span>
					<span className='subcatData'>{ (AD[6] && AD[6][2] ) ? AD[6][2] : <span className='empty'>empty</span> }</span>
					<span className='catName'>Area No.</span>
					<span className='subcatData'>{ (AD[6] && AD[6][3] ) ? AD[6][3] : <span className='empty'>empty</span> }</span>
				</li>
			</ul>
		);
	}

	renderSimpleCategory(catNum, catName) {
		let AD = this.props.areaData.areaDesc;
		return (
			<li>
				<span className='catNum'>{ catNum }</span>
				<span className='catName'>{ catName }</span>
				<span className='catData'>{ (AD[catNum] ) ? AD[catNum] : <span className='empty'>empty</span>}</span>
			</li>
		);
	}

	renderSimpleSubcategory(catNum, catLetter, subcatName) {
		let AD = this.props.areaData.areaDesc;
		return (
			<li>
				<span className='catLetter'>{ catLetter }</span>
				<span className='subcatName'>{ subcatName }</span>
				<span className='subcatData'>{ (AD[catNum] && AD[catNum][catLetter] ) ? AD[catNum][catLetter] : <span className='empty'>empty</span>}</span>
			</li>
		);
	}

	renderSimpleData(catNum, subcatLetter = '', order = null) {
		let AD = this.props.areaData.areaDesc;
		if (order == null) {
			return (
				<span>{ (AD[catNum] && AD[catNum][subcatLetter] ) ? AD[catNum][subcatLetter] : <span className='empty'>empty</span> }</span>
			);
		} else if (subcatLetter == '') {
			return (
				<span>{ (AD[catNum] && AD[catNum][order] ) ? AD[catNum][order] : <span className='empty'>empty</span> }</span>
			);
		} else {
			return (
				<span>{ (AD[catNum] && AD[catNum][subcatLetter] && AD[catNum][subcatLetter][order] ) ? AD[catNum][subcatLetter][order] : <span className='empty'>empty</span> }</span>
			);
		}
	}

}
