import { PropTypes } from 'react';
import {GeoJson}  from 'react-leaflet';

export default class AreaPolygon extends GeoJson {

	componentWillReceiveProps(nextProps) {
		if (nextProps.data !== this.props.data) {
			this.leafletElement.clearLayers();
		}
		if (nextProps.className !== this.props.className) {
			this.leafletElement.options.className = nextProps.className;
		}

		if (nextProps.fillOpacity !== this.props.fillOpacity) {
			this.leafletElement.options.fillOpacity = nextProps.fillOpacity;
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.data !== this.props.data) {
			this.leafletElement.addData(this.props.data);
		}
		this.setStyleIfChanged(prevProps.style, this.props.style);
	}
}

AreaPolygon.propTypes = {
	data: PropTypes.object.isRequired
};