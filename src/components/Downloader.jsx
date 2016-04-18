import React, { PropTypes } from 'react';
import { AppActionTypes } from '../utils/AppActionCreator';


export default class Downloader extends React.Component {
	// property validation
	static propTypes = {
		mapurl: PropTypes.string,
		name: PropTypes.string
	};

	constructor () {

		super();

	}

	componentWillMount () {}

	componentDidMount () {}

	componentWillUnmount () {}

	componentDidUpdate () {}

	render () {
		return (
			<div>
				<a href={this.props.mapurl} download={ this.props.name + "HOLCMap.jpg"}>Download HOLC map</a>
			</div>
		);
	}
}