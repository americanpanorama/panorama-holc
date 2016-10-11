import React from 'react';
import CitiesStore from '../stores/CitiesStore.js';

export default class Burgess extends React.Component {

	constructor () {
		super();
	}

	render () {
		return(
			<div className='longishform'>
				<button className='close' onClick={ this.props.onModalClick }><span>×</span></button>
				<div className='content'>
					<p><strong>Inspired by the 1920s-era "concentric zones theory" of Ernest W. Burgess, this interactive visualization offers a view of how redlining concentrated populations, and did so along a generally consistent pattern.</strong></p>
					<p>An urban sociologist of the extraordinarily influential Chicago School of Sociology, Burgess expounded this theory in a 1925 study <cite>The City</cite>. According to Burgess, every city developed as a series of concentric circles.  Downtown business districts would be surrounded by factory zones.  Factory zones would transition to slums, followed then by progressively more affluent housing for working people and the investor class, before then reaching the final zone, from whence commuters came into the city. As the historian Elaine Lewinnek points out, "Burgess adapted a half-century of Chicago maps and codified them in a model of abstraction and urban theory that has been called&#8212;with some hyperbole&#8212;'the most famous diagram in social science'" (<cite>The Working Man’s Reward: Chicago’s Early Suburbs and The Roots of American Sprawl</cite> (Oxford, 2014), 130).</p>",
					<img src='./static/burgess.png' />
					<p>In Burgess's model, each ring had cultural and economic features&#8212;features that he explicitly associated with ethnic and racial populations. Recent immigrants and black migrants occupied central slum districts rife with vice dens and run down rooming houses.  Second-generation European immigrants and factory and a shop workers, "skilled and thrifty," lived on the outer edge of the slums and on the inner edge of the ring of well-kept apartment houses and "workingmen's homes." Beyond them was the "Promised Land" of residential hotels and single-family homes.  In contrast to the swarthy, congested slums, these were "bright light areas" safely protected by restrictive covenants and high price points.</p>
					<figure><img src='./static/burgess-chicago.png' /><figcaption>Burgess's theory was drawn from and applied to Chicago.</figcaption></figure>
					<p>Burgess's model, in addition to reflecting the homes of real estate investor communities, served as an extension of wider segregationist thinking driving both sociology as a discipline and administrative practice during the progressive era.  Obsession with cities as "organisms" of society, they believed in what the sociologist Louis Wirth benignly described as the "eugenics of the city."</p>
					<p>Concentric cirles arguably were the spatial episteme of cities for early twentieth-century Americans. Concentric circles radiating out from the city center are visible on two dozen of the commercial maps HOLC colored to create the security maps: <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('albany-ny')}
							>
								Albany
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('altoona-pa')}
							>
								Altoona
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('charlotte-nc')}
							>
								Charlotte
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('erie-pa')}
							>
								Erie
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('fort-wayne-in')}
							>
								Fort Wayne
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('fresno-ca')}
							>
								Fresno
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('haverhill-ma')}
							>
								Haverhill
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('johnstown-pa')}
							>
								Johnstown
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('kalamazoo-mi')}
							>
								Kalamazoo
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('loraine-oh')}
							>
								Loraine
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('macon-ga')}
							>
								Macon
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('milwaukee-wi')}
							>
								Milwaukee
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('new-haven-ct')}
							>
								New Haven
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('norfolk-va')}
							>
								Norfolk
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('poughkeepsie-ny')}
							>
								Poughkeepsie
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('portland-or')}
							>
								Portland
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('racine-wi')}
							>
								Racine
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('san-jose-ca')}
							>
								San Jose
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('schenectady-ny')}
							>
								Schenectady
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('tacoma-wa')}
							>
								Tacoma
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('tampa-fl')}
							>
								Tampa
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('troy-ny')}
							>
								Troy
							</a>, <a
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('wheeling-wv')}
							>
								Wheeling
							</a>, <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('winston-salem-nc')}
							>
								Winston-Salem
							</a>, and <a 
								onClick={ this.props.onCitySelected }
								id={ CitiesStore.getADIdFromSlug('youngstown-oh')}
							>
								Youngstown
							</a>
					. Concentric circles that were drawn on the security map of Providence.</p>
					<figure><img src='./static/providence.png' style={ {width: 400} }/><figcaption>Security map of Providence, Rhode Island</figcaption></figure>

					<p>While this map is unique in having those added, given that many of the HOLC maps reflected both the categorical impulse and spatial organization of Burgess's model with D and C neighborhoods more likely to be located around central business districts and A and B neighborhoods in increasingly suburban peripheries, it seems possible or even likely that HOLC and many of its national and local agents had a version of the concentric circles model in their minds as they graded neighborhoods.</p>
					<p>The diagram visualizes the relative distribution of HOLC grades in relation to the center of the city. The opacity of the rings reflects the relative density of zoned areas on the map. Hovering over the rings will highlight areas for that grade.</p>
					<p>Our adaptation of Burgess diagrams is not meant to resuscitate his discredited theory.  Rather, we aim to show just how profoundly segregationist practices of redlining actually shaped American cities to resemble a roundly discredited social theory.  Segregation was not natural.  Quite the contrary, redlining greatly impeded the natural flows of people and capital.  Through federal action and local manipulation, life was made to imitate art.</p>
				</div>
			</div>
		);


	}
}