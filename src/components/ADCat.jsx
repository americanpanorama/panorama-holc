import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';


export default class ADCat extends React.Component {

	// property validation
	static propTypes = {
		categoryData: PropTypes.object
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

	renderGrade(grade) {
		return (
			<div>
				<div className={'grade-header' + grade}><h2>{ grade }</h2></div>
				<ul className='area_description' ref={ 'cat' + grade }>
					{ Object.keys(this.props.categoryData).map(neighborhoodId => {
						if (grade == neighborhoodId.charAt(0)) {
							return (
								<li key={ 'cat' + grade + neighborhoodId }>
									<span className='subcatName' onClick={ this.props.onNeighborhoodClick } id={ neighborhoodId }>{ neighborhoodId }</span>:
									{ (this.props.categoryData[neighborhoodId]) ? <span className='subcatData'>{ this.props.categoryData[neighborhoodId] }</span> : <span className='empty'>empty</span> }
								</li>
							);
						}
					})}
				</ul>
			</div>
		);
	}

	render () {

		return (
			<div>
				{ this.renderGrade('A') }
				{ this.renderGrade('B') }
				{ this.renderGrade('C') }
				{ this.renderGrade('D') }
			</div>
		);
	}

}