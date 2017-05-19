import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';
import SidebarNeighborhoodNav from './SidebarNeighborhoodNav.jsx';
import SidebarNeighborhoodTitle from './SidebarNeighborhoodTitle.jsx';

export default class AreaDescription extends React.Component {

	// property validation
	static propTypes = {
		areaDescriptions: React.PropTypes.oneOfType([
			PropTypes.object,
			PropTypes.bool
		])
	};

	// (instead of ES5-style getDefaultProps)
	static defaultProps = {
		areaDescriptions: {}
	};

	constructor () {
		super();

		// bind handlers
		const handlers = ['renderNSForm8_19370203','renderNSForm8_19371001','render1939','renderNSForm8_19371001_selections', 'renderNSForm8_19370203_selections', 'render1939_selection'];
		handlers.map(handler => { this[handler] = this[handler].bind(this); });
	}

	shouldComponentUpdate (nextProps) {
		return true;
		return (nextProps.areaId !== this.props.areaId || nextProps.cityId !== this.props.cityId || nextProps.previousStyle !== this.props.previousStyle);
	}

	render () {

		let renderForm = () => null;
		switch(parseInt(this.props.formId)) {
			case 19370203:
			case 19370601:
			case 19370826:
				renderForm = (this.props.show == 'full') ? this.renderNSForm8_19370203 : this.renderNSForm8_19370203_selections;
				break;
			case 19371001:
				renderForm = (this.props.show == 'full') ? this.renderNSForm8_19371001 : this.renderNSForm8_19371001_selections;
				break;
			case 1939:
				renderForm = (this.props.show == 'full') ? this.render1939 : this.render1939_selection;
				break;
		}

		return (
			<div className='areaDescription'>

				<SidebarNeighborhoodTitle
					areaId={ this.props.areaId }
					name={ this.props.neighborhoodNames[this.props.areaId] }
					citySlug={ this.props.citySlug }
					onClose={ this.props.onClose }
				/>

				{ (this.props.previousAreaId) ?
					<SidebarNeighborhoodNav
						style={ this.props.previousStyle }
						onHOLCIDClick={ this.props.onHOLCIDClick } 
						areaId ={ this.props.previousAreaId } 
						name={ this.props.neighborhoodNames[this.props.previousAreaId] }
					/> :
					''
				}

				{ (this.props.nextAreaId && this.props.nextAreaId !== 'null') ?
					<SidebarNeighborhoodNav
						style={ this.props.nextStyle }
						onHOLCIDClick={ this.props.onHOLCIDClick } 
						areaId ={ this.props.nextAreaId } 
						name={ this.props.neighborhoodNames[this.props.nextAreaId] }
					/> :
					''
				}

				{ (this.props.areaDescriptions && this.props.show == 'selection' ) ?
					<h4 className='shown' onClick={ this.props.onToggleADView }>Curated Selections from Area Description<br /><span className='instructions'>(click here to show full)</span></h4> :
					null
				}

				{ (this.props.areaDescriptions && this.props.show == 'full' ) ?
					<h4 className='shown' onClick={ this.props.onToggleADView }>Complete Area Description<br /><span className='instructions'>(click here to show curated selection)</span></h4> :
					null
				}

				{ renderForm() }

				{ (this.props.hasADImages && this.props.sheets > 0) ? 
					<figure className='adThumbnail'>
						<img src={ this.props.thumbnailUrl } onClick={ this.props.onAdImageClicked } />
						<figcaption>Click on the thumbnail to see a zoomable version.</figcaption>
					</figure> : 
					''
				}

				{ (this.props.hasADImages && this.props.sheets == 0) ? 
					<div className='adInstructions'>An area description for { this.props.areaId } is not available.</div> : 
					''
				}

				<div className='cityStats'>
				{ (!this.props.hasADImages && !this.props.formId) ? 
					<div className='adInstructions'>The area description has not yet been added for { this.props.areaId }.</div> :
					''
				}
				</div>
			</div>
		);
	}

	renderNSForm8_19370203_selections() {
		let AD = this.props.areaDescriptions;

		if (AD === false) {
			return;
		}

		return (

			<ul className='area_description NSForm8'>
				{ this.renderSimpleCategory(14, 'Clarifying Remarks') }

			<li>
					<span className='catNum'>5</span>
					<span className='catName'>Inhabitants</span>
					<ul>
						{ this.renderSimpleSubcategory(5, 'e', 'Infiltration of') }
						{ this.renderSimpleSubcategory(5, 'f', 'Relief families') }
						<li>
							<span className='catLetter catSelectable' onClick={ this.props.onCategoryClick } id='5-c'>c</span>
							<span className='subcatName catSelectable' onClick={ this.props.onCategoryClick } id='5-c'>Foreign-born</span>
							<span className='subcatData'>{ (AD[5] && AD[5]['c']['1'] ) ? AD[5]['c']['1'] : <span className='empty'>empty</span> }; { (AD[5] && AD[5]['c']['2'] ) ? AD[5]['c']['2'] : <span className='empty'>empty</span> }</span>
						</li>
						<li>
							<span className='catLetter catSelectable' onClick={ this.props.onCategoryClick } id='5-d'>d</span>
							<span className='subcatName catSelectable' onClick={ this.props.onCategoryClick } id='5-d'>Negro</span>
							<span className='subcatData'>{ (AD[5] && AD[5]['d']['1'] ) ? AD[5]['d']['1'] : <span className='empty'>empty</span> }; { (AD[5] && AD[5]['d']['2'] ) ? AD[5]['d']['2'] : <span className='empty'>empty</span> }</span>
						</li>
						{ this.renderSimpleSubcategory(5, 'a', 'Type') }
						{ this.renderSimpleSubcategory(5, 'b', 'Estimated annual family income') }
					</ul>
				</li>
				
				{ this.renderSimpleCategory(3, 'Favorable Influences') }
				{ this.renderSimpleCategory(4, 'Detrimental Influences') }
				{ this.renderSimpleCategory(2, 'Description of Terrain') }
			</ul>
		);
	}


	renderNSForm8_19370203() {
		let AD = this.props.areaDescriptions;

		if (AD === false) {
			return;
		}

		return (

			<ul className='area_description NSForm8'>
				<li>
					<span className='catNum'>1</span>
					<span className='catName'>Name of City</span>
					<span className='subcatData'>{ (AD[1] && AD[1][1] ) ? AD[1][1] : <span className='empty'>empty</span> }</span>
				</li>
				<li>				
					<span className='catName indent'> Security Grade </span>
					<span className='subcatData'>{ (AD[1] && AD[1][2] ) ? AD[1][2] : <span className='empty'>empty</span> }</span>
				</li>
				<li>
					<span className='catName indent'> Area No. </span>
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
							<span className='catLetter catSelectable' onClick={ this.props.onCategoryClick } id='5-c'>c</span>
							<span className='subcatName catSelectable' onClick={ this.props.onCategoryClick } id='5-c'>Foreign-born</span>
							<span className='subcatData'>{ (AD[5] && AD[5]['c']['1'] ) ? AD[5]['c']['1'] : <span className='empty'>empty</span> }; { (AD[5] && AD[5]['c']['2'] ) ? AD[5]['c']['2'] : <span className='empty'>empty</span> }</span>
						</li>
						<li>
							<span className='catLetter catSelectable' onClick={ this.props.onCategoryClick } id='5-d'>d</span>
							<span className='subcatName catSelectable' onClick={ this.props.onCategoryClick } id='5-d'>Negro</span>
							<span className='subcatData'>{ (AD[5] && AD[5]['d']['1'] ) ? AD[5]['d']['1'] : <span className='empty'>empty</span> }; { (AD[5] && AD[5]['d']['2'] ) ? AD[5]['d']['2'] : <span className='empty'>empty</span> }</span>
						</li>
						{ this.renderSimpleSubcategory(5, 'e', 'Infiltration of') }
						{ this.renderSimpleSubcategory(5, 'f', 'Relief families') }
						<li>
							<span className='catLetter catSelectable' onClick={ this.props.onCategoryClick } id='5-g'>g</span>
							<span className='subcatName catSelectable' onClick={ this.props.onCategoryClick } id='5-g'>Population is increasing</span>
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
								<th>{ (AD[7] && AD[7][5] ) ? AD[7][5] : ''} level</th>
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
					<div className='percentage'>
						<span className='subcatName'>Peak Sales values occurred in</span>
						<span className='subcatData'>{ (AD[7] && AD[7][19] ) ? AD[7][19] : <span className='empty'>empty</span> }</span>
						<span className='subcatName'> and were </span>
						<span className='subcatData'>{ (AD[7] && AD[7][20] ) ? AD[7][20] : <span className='empty'>empty</span> }</span>
						<span className='subcatName'>% of the 1929 level.</span>
					</div>
					<div className='percentage'>
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
				<li>
					<span className='catNum'>15</span>
					<span className='catName'>Information for this form was obtained from</span>
					<span className='subcatData'>{ (AD[15]  && typeof(AD[15]) == 'string' ) ? AD[15] : (AD[15] && AD[15][1]) ? AD[15][1] : <span className='empty'>empty</span> }</span>
				</li>
				{ (typeof(AD[15]) === 'object') ?
					<li>
						<span className='catName indent'>Date</span>
						<span className='subcatData'>{ (AD[15] && AD[15][2] ) ? AD[15][2] : <span className='empty'>empty</span> }</span>
						<span className='catName indent'>193</span><span className='subcatData'>{ (AD[15] && AD[15][3] ) ? AD[15][3] : <span className='empty'>empty</span> }</span>
					</li> :
					''
				}
			</ul>
		);
	}

	renderNSForm8_19371001_selections() {
		let AD = this.props.areaDescriptions;

		if (AD === false) {
			return;
		}

		return (
			<ul className='area_description NSForm8'>
					{ this.renderSimpleCategory(5, 'Clarifying Remarks') }
					<li>
						<span className='catNum'>2</span>
						<span className='catName'>Inhabitants</span>
						<ul>
							{ this.renderSimpleSubcategory(2, 'e', 'Infiltration of') }
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
							{ this.renderSimpleSubcategory(2, 'f', 'Relief families') }
							{ this.renderSimpleSubcategory(2, 'a', 'Occupation') }
							{ this.renderSimpleSubcategory(2, 'b', 'Estimated Annual Family Income') }
						</ul>
					</li>
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
			</ul>
		);
	}

	renderNSForm8_19371001() {
		let AD = this.props.areaDescriptions;

		if (AD === false) {
			return;
		}

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
					<table>
						<thead>
							<tr>
								<th></th>
								<th>Predominating { this.renderSimpleData(3, null, 1) }%</th>
								<th>Other Type { this.renderSimpleData(3, null, 2) }%</th>
								<th>Other Type { this.renderSimpleData(3, null, 3) }%</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<span className='catLetter'>a</span>
									<span className='catName'>Type</span>
								</td>
								<td>{ this.renderSimpleData(3, 'a', 1) }</td>
								<td>{ this.renderSimpleData(3, 'a', 2) }</td>
								<td>{ this.renderSimpleData(3, 'a', 3) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>b</span>
									<span className='catName'>Construction</span>
								</td>
								<td>{ this.renderSimpleData(3, 'b', 1) }</td>
								<td>{ this.renderSimpleData(3, 'b', 2) }</td>
								<td>{ this.renderSimpleData(3, 'b', 3) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>c</span>
									<span className='catName'>Average age</span>
								</td>
								<td>{ this.renderSimpleData(3, 'c', 1) } <span className='catName'>Years</span></td>
								<td>{ this.renderSimpleData(3, 'c', 2) } <span className='catName'>Years</span></td>
								<td>{ this.renderSimpleData(3, 'c', 3) } <span className='catName'>Years</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>d</span>
									<span className='catName'>Repair</span>
								</td>
								<td>{ this.renderSimpleData(3, 'd', 1) }</td>
								<td>{ this.renderSimpleData(3, 'd', 2) }</td>
								<td>{ this.renderSimpleData(3, 'd', 3) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>e</span>
									<span className='catName'>Occupancy</span>
								</td>
								<td>{ this.renderSimpleData(3, 'e', 1) }<span className='catName'>%</span></td>
								<td>{ this.renderSimpleData(3, 'e', 2) }<span className='catName'>%</span></td>
								<td>{ this.renderSimpleData(3, 'e', 3) }<span className='catName'>%</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>f</span>
									<span className='catName'>Home Ownership</span>
								</td>
								<td>{ this.renderSimpleData(3, 'f', 1) }<span className='catName'>%</span></td>
								<td>{ this.renderSimpleData(3, 'f', 2) }<span className='catName'>%</span></td>
								<td>{ this.renderSimpleData(3, 'f', 3) }<span className='catName'>%</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>g</span>
									<span className='catName'>Constructed past yr.</span>
								</td>
								<td>{ this.renderSimpleData(3, 'g', 1) }</td>
								<td>{ this.renderSimpleData(3, 'g', 2) }</td>
								<td>{ this.renderSimpleData(3, 'g', 3) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>h</span>
									<span className='catName'>1929 Price range</span>
								</td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'h', 1) } <span className='catName'>100%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'h', 2) } <span className='catName'>100%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'h', 3) } <span className='catName'>100%</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>i</span>
									<span className='catName'>{ this.renderSimpleData(3, 'i', 1) } Price range</span>
								</td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'i', 2) } { this.renderSimpleData(3, 'i', 3) }<span className='catName'>100%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'i', 4) } { this.renderSimpleData(3, 'i', 5) }<span className='catName'>%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'i', 6) } { this.renderSimpleData(3, 'i', 7) }<span className='catName'>%</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>j</span>
									<span className='catName'>{ this.renderSimpleData(3, 'j', 1) } Price range</span>
								</td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'j', 2) } { this.renderSimpleData(3, 'j', 3) }<span className='catName'>100%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'j', 4) } { this.renderSimpleData(3, 'j', 5) }<span className='catName'>%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'j', 6) } { this.renderSimpleData(3, 'j', 7) }<span className='catName'>%</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>k</span>
									<span className='catName'>Sales demand Up to</span>
								</td>
								<td>{ this.renderSimpleData(3, 'k', 1) }</td>
								<td>Up to { this.renderSimpleData(3, 'k', 2) }</td>
								<td>{ this.renderSimpleData(3, 'k', 3) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>l</span>
									<span className='catName'>Activity</span>
								</td>
								<td>{ this.renderSimpleData(3, 'l', 1) }</td>
								<td>{ this.renderSimpleData(3, 'l', 2) }</td>
								<td>{ this.renderSimpleData(3, 'l', 3) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>m</span>
									<span className='catName'>1929 Rent range</span>
								</td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'm', 1) } <span className='catName'>100%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'm', 2) } <span className='catName'>100%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'm', 3) } <span className='catName'>100%</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>n</span>
									<span className='catName'>{ this.renderSimpleData(3, 'n', 1) } Rent range</span>
								</td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'n', 2) } { this.renderSimpleData(3, 'n', 3) }<span className='catName'>100%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'n', 4) } { this.renderSimpleData(3, 'n', 5) }<span className='catName'>%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'n', 6) } { this.renderSimpleData(3, 'n', 7) }<span className='catName'>%</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>o</span>
									<span className='catName'>{ this.renderSimpleData(3, 'o', 1) } Rent range</span>
								</td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'o', 2) } { this.renderSimpleData(3, 'o', 3) }<span className='catName'>100%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'o', 4) } { this.renderSimpleData(3, 'o', 5) }<span className='catName'>%</span></td>
								<td><span className='catName'>$</span>{ this.renderSimpleData(3, 'o', 6) } { this.renderSimpleData(3, 'o', 7) }<span className='catName'>%</span></td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>p</span>
									<span className='catName'>Rental demand Up to</span>
								</td>
								<td>{ this.renderSimpleData(3, 'p', 1) }</td>
								<td>Up to { this.renderSimpleData(3, 'p', 2) }</td>
								<td>{ this.renderSimpleData(3, 'p', 3) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>q</span>
									<span className='catName'>Activity</span>
								</td>
								<td>{ this.renderSimpleData(3, 'q', 1) }</td>
								<td>{ this.renderSimpleData(3, 'q', 2) }</td>
								<td>{ this.renderSimpleData(3, 'q', 3) }</td>
							</tr>
						</tbody>
					</table>
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

	render1939_selection() {
		let AD = this.props.areaDescriptions;

		if (AD === false) {
			return;
		}

		return (
			<ul className='area_description'>
				{ this.renderSimpleCategory(8, 'Description and Characteristics of Area') }
				<li>
					<span className='catNum'>1</span>
					<span className='catName'>Population</span>
					<ul>
						{ this.renderSimpleSubcategory(1, 'e', 'Shifting or Infiltration') }
						<li>
							<span className='catLetter'>c</span>
							<span className='catName'>Foreign Families</span>
							<span className='subcatData'>{ this.renderSimpleData(1, 'c', 1) }</span><br />
							<span className='catName'> Nationalities</span>
							<span className='subcatData'> { this.renderSimpleData(1, 'c', 2) }</span>
						</li>
						{ this.renderSimpleSubcategory(2, 'd', 'Negro') }
						{ this.renderSimpleSubcategory(1, 'b', 'Class and Occupation') }
					</ul>
				</li>
			</ul>
		);
	}

	render1939() {
		let AD = this.props.areaDescriptions;

		if (AD === false) {
			return;
		}

		return (
			<ul className='area_description'>
				<li>
					<span className='catNum'>1</span>
					<span className='catName'>Population</span>
					<ul>
						<li>
							<span className='catLetter'>a</span>
							<span className='catName'>Increasing</span>
							<span className='subcatData'>{ this.renderSimpleData(1, 'a', 1) }</span><br />
							<span className='catName'> Decreasing</span>
							<span className='subcatData'> { this.renderSimpleData(1, 'a', 2) }</span><br />
							<span className='catName'> Static</span>
							<span className='subcatData'> { this.renderSimpleData(1, 'a', 3) }</span>
						</li>
						{ this.renderSimpleSubcategory(1, 'b', 'Class and Occupation') }
						<li>
							<span className='catLetter'>c</span>
							<span className='catName'>Foreign Families</span>
							<span className='subcatData'>{ this.renderSimpleData(1, 'c', 1) }</span><br />
							<span className='catName'> Nationalities</span>
							<span className='subcatData'> { this.renderSimpleData(1, 'c', 2) }</span>
						</li>
						{ this.renderSimpleSubcategory(2, 'd', 'Negro') }
						{ this.renderSimpleSubcategory(1, 'e', 'Shifting or Infiltration') }
					</ul>
				</li>
				<li>
					<span className='catNum'>2</span>
					<span className='catName'>Buildings</span>

					<table>
						<tbody>
							<tr>
								<th></th>
								<th colSpan={2}>Predominating { this.renderSimpleData(2, '', 1) }%</th>
								<th colSpan={2}>Other Type { this.renderSimpleData(2, '', 2) }%</th>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>a</span>
									<span className='catName'>Type and Size</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'a', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'a', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>b</span>
									<span className='catName'>Construction</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'b', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'b', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>c</span>
									<span className='catName'>Average Age</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'c', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'c', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>d</span>
									<span className='catName'>Repair</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'd', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'd', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>e</span>
									<span className='catName'>Occupancy</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'e', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'e', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>f</span>
									<span className='catName'>Owner-occupied</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'f', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'f', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>g</span>
									<span className='catName'>1935 Price Bracket</span>
								</td>
								<td>${ this.renderSimpleData(2, 'g', 1) }</td>
								<th>% change</th>
								<td>${ this.renderSimpleData(2, 'g', 2) }</td>
								<th>% change</th>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>h</span>
									<span className='catName'>1937 Price Bracket</span>
								</td>
								<td>${ this.renderSimpleData(2, 'h', 1) }</td>
								<td>{ this.renderSimpleData(2, 'h', 2) }%</td>
								<td>${ this.renderSimpleData(2, 'h', 3) }</td>
								<td>{ this.renderSimpleData(2, 'h', 4) }%</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>i</span>
									{ this.renderSimpleData(2, 'i', 1) } <span className='catName'>Price Bracket</span>
								</td>
								<td>${ this.renderSimpleData(2, 'i', 2) }</td>
								<td>{ this.renderSimpleData(2, 'i', 3) }%</td>
								<td>${ this.renderSimpleData(2, 'i', 4) }</td>
								<td>{ this.renderSimpleData(2, 'i', 5) }%</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>j</span>
									<span className='catName'>Sales Demand</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'j', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'j', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>k</span>
									<span className='catName'>Predicted Price Trend<br />(next 6-12 months)</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'k', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'k', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>l</span>
									<span className='catName'>1935 Rent Bracket</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'l', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'l', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>m</span>
									<span className='catName'>1937 Rent Bracket</span>
								</td>
								<td>${ this.renderSimpleData(2, 'm', 1) }</td>
								<td>{ this.renderSimpleData(2, 'm', 2) }%</td>
								<td>${ this.renderSimpleData(2, 'm', 3) }</td>
								<td>{ this.renderSimpleData(2, 'm', 4) }%</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>n</span>
									{ this.renderSimpleData(2, 'n', 1) }<span className='catName'>Rent Bracket</span>
								</td>
								<td>${ this.renderSimpleData(2, 'n', 2) }</td>
								<td>{ this.renderSimpleData(2, 'n', 3) }%</td>
								<td>${ this.renderSimpleData(2, 'n', 4) }</td>
								<td>{ this.renderSimpleData(2, 'n', 5) }%</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>o</span>
									<span className='catName'>Rental Demand</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'o', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'o', 2) }</td>
							</tr>
							<tr>
								<td>
									<span className='catLetter'>p</span>
									<span className='catName'>Predicted Rent Trend<br />(next 6-12 months)</span>
								</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'p', 1) }</td>
								<td colSpan={2}>{ this.renderSimpleData(2, 'p', 2) }</td>
							</tr>
						</tbody>
					</table>
				</li>
				<li>
					<span className='catNum'>3</span>
					<span className='catName'>New Construction (past yr.)</span>
					<div>
						<span className='subcatName'>No.</span> { this.renderSimpleData(3, '', 1) }
						<span className='subcatName'>Type &amp; Price</span> { this.renderSimpleData(3, '', 2) }
						<span className='subcatName'>How Selling</span> { this.renderSimpleData(3, '', 3) }
					</div>
				</li>
				<li>
					<span className='catNum'>4</span>
					<span className='catName'>Overhang of Home Properties</span>
					<ul>
						{ this.renderSimpleSubcategory(4, 'a', 'HOLC') }
						{ this.renderSimpleSubcategory(4, 'b', 'Institutions') }
					</ul>
				</li>
				<li>
					<span className='catNum'>5</span>
					<span className='catName'>Sale of Home Properties</span>
					<ul>
						{ this.renderSimpleSubcategory(5, 'a', 'HOLC') }
						{ this.renderSimpleSubcategory(5, 'b', 'Institutions') }
					</ul>
				</li>
				{ this.renderSimpleCategory(6, 'Mortgage Funds') }
				<li>
					<span className='catNum'>7</span>
					<span className='catName'>Total Tax Rate Per $1000 (193</span>{ this.renderSimpleData(7, '', 1) }<span className='catName'>)</span>
					<span className='catData'>{ this.renderSimpleData(7, '', 2) }</span>
				</li>
				{ this.renderSimpleCategory(8, 'Description and Characteristics of Area') }
				<li>
					<span className='catNum'>9</span>
					<span className='catName'>Location</span> { this.renderSimpleData(9, '', 1) }
					<div><span className='catName'>Security Grade</span> { this.renderSimpleData(9, '', 2) }</div>
					<div><span className='catName'>Area No</span> { this.renderSimpleData(9, '', 3) }</div>
					<div><span className='catName'>Date</span> { this.renderSimpleData(9, '', 4) }</div>
				</li>
			</ul>
		);
	}

	renderSimpleCategory(catNum, catName) {
		let AD = this.props.areaDescriptions;
		
		return (
			<li key={'AD-' + catNum}>
				<span className='catNum catSelectable' onClick={ this.props.onCategoryClick } id={ catNum }>{ catNum }</span>
				<span className='catName catSelectable' onClick={ this.props.onCategoryClick } id={ catNum }>{ catName }</span>
				<span className='catData'>{ (AD[catNum] ) ? AD[catNum] : <span className='empty'>empty</span>}</span>
			</li>
		);
	}

	renderSimpleSubcategory(catNum, catLetter, subcatName) {
		let AD = this.props.areaDescriptions; 

		if (AD === false) {
			return;
		}

		if (!AD[catNum]) {
			console.warn(catNum + catLetter + ' is not defined', AD);
			return;
		}

		if (typeof AD[catNum][catLetter] == 'object') {
			console.warn(catNum + catLetter + ' is an object when a string was expected');
		}
		return (
			<li>
				<span className='catLetter catSelectable' onClick={ this.props.onCategoryClick } id={ catNum + '-' + catLetter }>{ catLetter }</span>
				<span className='subcatName catSelectable' onClick={ this.props.onCategoryClick } id={ catNum + '-' + catLetter }>{ subcatName }</span>
				<span className='subcatData'>{ (AD[catNum] && AD[catNum][catLetter] && typeof AD[catNum][catLetter] !== 'object' ) ? AD[catNum][catLetter] : <span className='empty'>empty</span>}</span>
			</li>
		);
	}

	renderSimpleData(catNum, subcatLetter = '', order = null) {
		let AD = this.props.areaDescriptions;
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
