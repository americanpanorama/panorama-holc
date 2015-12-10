import { GeoJson } from 'react-leaflet';
import React from 'react';
import isEqual from 'lodash/lang/isEqual';

export default class SeanGeoJson extends GeoJson {

	componentDidUpdate (prevProps) {
		this.setStyleIfChanged(prevProps, this.props);
	}

	setStyleIfChanged(fromProps, toProps) {
		const nextStyle = this.getPathOptions(toProps);
		if (!isEqual(nextStyle, this.getPathOptions(fromProps))) {
			this.setStyle(nextStyle);
			console.log(nextStyle);
		}
	}

	/* render() {
		const className = this.props.className || "";
		return this.renderChildrenWithProps({
			popupContainer: this.leafletElement,
		});
	}

	render1() {
		const className = this.props.className || "";
		const children = this.getClonedChildrenWithMap({
			popupContainer: this.leafletElement,
		});
		return <div className={ className } style={{display: 'none'}}>{children}</div>;
	} */
};
