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
			return (<span></span>);
		}

		console.log(this.props.areaData);


		return (
			<div className='area_description'>
				<div id="neighborhood">
					<div className="data_title">Neighborhood</div>
					<div id="neighborhood_name"></div>
					<div id="neighborhood_location"></div>
					<div id="neighborhood_id"></div>
					<div id="holc_grade">{ this.props.areaData.holc_grade }</div>
				</div>
				<div className='area_desc'>
					<div className='data_title'>Area Description</div>
					<ul className="area_data">
						{ Object.keys(this.props.areaData.areaDesc).map((catNum) => {
							let catData = this.props.areaData.areaDesc[catNum];
							let subcats = null;
							if (!catData.hasOwnProperty("question")) {
								subcats = Object.keys(this.props.areaData.areaDesc[catNum]).sort().map((subcatLetter) => {
									console.log(catNum, subcatLetter);
									return (
										<li key={ catNum + subcatLetter }><span className="category">{ subcatLetter }.</span> { catData[subcatLetter].question + ":"}  { catData[subcatLetter].answer }</li>
									)
								});
							}
							console.log(subcats);
							return (
								<li key={ catNum }>
									<span className="category">{ catNum }.</span> { catData.question + ":"}  { catData.answer }
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
