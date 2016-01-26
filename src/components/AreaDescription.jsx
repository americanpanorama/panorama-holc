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

		console.log(this.props.areaData.areaDesc);

		if (typeof(this.props.areaData.areaDesc) == 'undefined') {
			return false;
		}

		return this.renderNSForm8_19370203();

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
		return (
			<ul className='area_description NSForm8'>
				{ this.renderSimpleCategory(2, 'Description of Terrain') }
				{ this.renderSimpleCategory(3, 'Favorable Influences') }
				{ this.renderSimpleCategory(4, 'Detrimental Influences') }
				<li>
					<span className='catNum'>5</span>
					<span className='catName'>Inhabitants</span>
					<ul>
						{ this.renderSimpleSubcategory(5, 'a', 'Type') }
						{ this.renderSimpleSubcategory(5, 'b', 'Estimated annual family income') }
						{ this.renderSimpleSubcategory(5, 'c', 'Foreign-born') }
						{ this.renderSimpleSubcategory(5, 'd', 'Negro') }
						{ this.renderSimpleSubcategory(5, 'e', 'Infiltration of') }
						{ this.renderSimpleSubcategory(5, 'f', 'Relief families') }
						{ this.renderSimpleSubcategory(5, 'g', 'Population is') }
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
						{ this.renderSimpleSubcategory(2, 'c', 'Foreign-born families') }
						{ this.renderSimpleSubcategory(2, 'd', 'Negro') }
						{ this.renderSimpleSubcategory(2, 'e', 'Infiltration of') }
						{ this.renderSimpleSubcategory(2, 'f', 'Relief families') }
						{ this.renderSimpleSubcategory(2, 'g', 'Population is') }
					</ul>
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
			</ul>
		);
	}

	renderSimpleCategory(catNum, catName) {
		let AD = this.props.areaData.areaDesc;
		return (
			<li>
				<span className='catNum'>{ catNum }</span>
				<span className='catName'>{ catName }</span>
				<span className='catData'>{ (AD[catNum] && AD[catNum].answer ) ? AD[catNum].answer : <span className='empty'>empty</span>}</span>
			</li>
		);
	}

	renderSimpleSubcategory(catNum, catLetter, subcatName) {
		let AD = this.props.areaData.areaDesc;
		return (
			<li>
				<span className='catLetter'>{ catLetter }</span>
				<span className='subcatName'>{ subcatName }</span>
				<span className='subcatData'>{ (AD[catNum] && AD[catNum][catLetter] ) ? AD[catNum][catLetter].answer : <span className='empty'>empty</span>}</span>
			</li>
		);
	}

}
