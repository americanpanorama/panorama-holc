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

		if (typeof(this.props.areaData.areaDesc) == 'undefined') {
			return false;
		}

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
										<li key={ catNum + subcatLetter }>{ subcatLetter }. { catData[subcatLetter].question }:  { catData[subcatLetter].answer }</li>
									)
								});
							}
							return (
								<li key={ catNum }>
									<span className="category">{ catNum }. { catData.question }</span>  { catData.answer }
									<ul>{ subcats }</ul>
								</li>
							)
						}) }
					</ul>
				</div>
			</div>
		);

	}

}
