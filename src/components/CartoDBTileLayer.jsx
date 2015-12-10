/*
 * TODO: Submit this component as a PR to react-leaflet,
 * instead of adding to @panorama.
 * Might need to submit with tests, but other similar components are not currently tested.
 * Will need to pull in CartoDB dependency via an `npm install` and an `import`
 * rather than via a global <script> include.
 */

import { PropTypes } from 'react';
import { tileLayer } from 'leaflet';
import { BaseTileLayer } from 'react-leaflet';

// Not possible until CartoDB releases an npm package for the Core API.
// import { Tiles } from 'cartodb';

// Until then, consumer applications must include the cartodb.js script elsewhere,
// e.g. in index.html as <script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.core.js"></script>
const Tiles = cartodb.Tiles;


export default class CartoDBTileLayer extends BaseTileLayer {

	static propTypes = {
		userId: PropTypes.string,
		sql: PropTypes.string,
		cartocss: PropTypes.string
	};

	componentWillMount () {

		super.componentWillMount();
		this.leafletElement = tileLayer('', this.props);

		this._getCartoDBTilesTemplates(function (error, response) {
			if (error) {
				// TODO: handle error
				console.error(error);
			} else {
				this.leafletElement.setUrl(response.tiles[0]);
			}
		}.bind(this));
	}

	_getCartoDBTilesTemplates (callback) {
		Tiles.getTiles({
			type: 'cartodb',
			user_name: this.props.userId,
			sublayers: [{
				"sql": this.props.sql,
				"cartocss": this.props.cartocss
			}]
		},

		function (tiles, error) {
			if (!tiles || error) {
				if (!error) {
					error = "Empty response.";
				}
				callback(error, tiles);
			} else {
				callback(null, tiles);
			}
		});
	}

}
