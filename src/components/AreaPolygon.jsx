import React from "react";
import {GeoJson}  from "react-leaflet";

export default class AreaPolygon extends GeoJson {

	componentWillReceiveProps(nextProps) {
		if (nextProps.data !== this.props.data) {
			this.leafletElement.clearLayers();
		}
		if (nextProps.className !== this.props.className) {
			this.leafletElement.options.className = nextProps.className;
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.data !== this.props.data) {
			this.leafletElement.addData(this.props.data);
		}
	}
}

AreaPolygon.propTypes = {
	data: React.PropTypes.object.isRequired
};