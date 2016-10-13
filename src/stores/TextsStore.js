import { EventEmitter } from 'events';
import AppDispatcher from '../utils/AppDispatcher';
import { AppActionTypes } from '../utils/AppActionCreator';

const TextsStore = {

	data: {
		modal: {
			open: false,
			subject: null
		},
		intro: [
			"<h2>Introduction</h2>",
			"<p><cite>Mapping Inequality</cite> updates the study of New Deal America, the federal government, housing, and inequality for the twenty-first century. It offers unprecedented online access to the national collection of \"security maps\" and area descriptions produced between 1935 and 1940 by one of the New Deal's most important agencies, the Home Owners' Loan Corporation or HOLC (pronounced \"holk\"). </p>",
			"<p>HOLC recruited mortgage lenders, developers, and real estate appraisers in nearly 250 cities to create maps that color-coded credit worthiness and risk on neighborhood and metropolitan levels. These maps and their accompanying documentation helped set the rules for nearly a century of real estate practice. They have also served as critical evidence in countless urban studies in the fields of history, sociology, economics, and law.  Indeed, more than a half-century of research has shown housing to be for the twentieth century what slavery was to the antebellum period, namely the broad foundation of both American prosperity and racial inequality.  Through offering a digital library of the state's role in housing development, <cite>Mapping Inequality</cite> illustrates vividly the interplay between racism, administrative culture, economics, and the built environment.</p>",
			"<p><cite>Mapping Inequality</cite> introduces viewers to the records of the Home Owners Loan Corporation on a scale that is unprecedented. Visitors can browse over 150 interactive maps and roughly 5000 individual area descriptions to get a view of Depression-era America as developers, realtors, tax assessors, and surveyors saw it&#8212;a set of interlocking color-lines, racial groups, and environmental risks.  (Nearly all of the maps and area descriptions are available here, though a handful haven't yet been added.) They can also use the maps and area descriptions to draw connections between past state actions (and inactions) and contemporary American problems.</p>",
			"<h3>Archiving Inequality for the Digital Age</h3>",
			"<p>Like so many other government agencies during the New Deal, HOLC and its parent bureau, the Federal Home Loan Bank Board, shaped Americans' lives and livelihoods profoundly during and after the Great Depression of the 1930s. Both proved critical to protecting and expanding home ownership, to standardizing lending practices, and to encouraging residential and commercial real estate investment in a flagging economy.  Across the middle third of the twentieth century, arguably the most prosperous decades in American history, these agencies worked with public and private sector partners to create millions of jobs and help millions of Americans buy or keep their homes. At the very same time, federal housing programs helped codify and expand practices of racial and class segregation.  They ensured, moreover, that rampant real estate speculation and environmental degradation would accompany America's remarkable economic recovery and growth.</p>",
			"<p><cite>Mapping Inequality</cite> brings one of the country's most important archives to the public.  HOLC's documents contain a wealth of information about how government officials, lenders, and real estate interests surveyed and ensured the economic health of American cities.  And with the help of ongoing research, we continue to learn at what cost such measures were realized.</p>",
			"<p>Over the last thirty years especially, scholars have characterized HOLC's property assessment and risk management practices, as well as those of the Federal Housing Administration, Veterans Administration, and US. Housing Authority, as some of the most important factors in preserving racial segregation, intergenerational poverty, and the continued wealth gap between white Americans and most other groups in the U.S.  Many of these agencies operated under the influence of powerful real estate lobbies or wrote their policies steeped in what were, at the time, widespread assumptions about the profitability of racial segregation and the residential incompatibility of certain racial and ethnic groups.  Through HOLC, in particular, real estate appraisers used the apparent racial and cultural value of a community to determine its economic value.  <cite>Mapping Inequality</cite> offers a window into the New Deal era housing policies that helped set the course for contemporary America. This project provides visitors with a new view, and perhaps even a new language, for describing the relationship between wealth and poverty in America.</p>"
		],
		bibliograph: [
			"<h2>Bibliographic Note</h2>",
			"<p>The Home Owners Loan Corporation (HOLC) has long been seen as both a savior to the housing sector and a force for racial segregation.  As the economic collapse of the 1930s recedes beyond living memory, historians have focused more on the segregationist nature of housing policy—how racism helped save the American economy.  The legislation creating HOLC came out of the first 100 days of the Roosevelt administration and provided billions of dollars for the rescue of banks, thrifts, and distressed homeowners.  New Deal legislation was highly popular in the midst of an economic crisis—the Democratically-controlled House of Representatives passed the bill 383-4.</p>",
			"<p>HOLC helped restructure the American mortgage lending market by creating and standardizing several of its elements.  HOLC incorporated appraisal of home value into its lending processes, a practice only in its infancy at the time.  HOLC supported the training of home appraisers and employed hundreds of appraisers throughout the 1930s, working in concert with the nation’s realtors to inaugurate and advance real estate appraisal as a profession.  HOLC’s department of Research and Statistics drew upon its network of realtors, developers, lenders, and appraisers to create a neighborhood-by-neighborhood assessment of more than 200 cities in the country.  These assessments included demographic data, economic reports, and the color-coded Security Maps later deemed infamous as instruments of “redlining.”</p>",
			"<p>The mainstream white press—major daily newspapers and periodicals—greeted the agency and its programs with approval.  They explained the program and forecast upturns in the real estate and construction sectors, as the program enjoyed popular support.  In Chicago, seventeen thousand people stood in line at HOLC’s office the first day it opened in August of 1933 to inquire or apply for aid.  The corporation’s main lending phase ended after three years and the corporation receded from mainstream public view.  HOLC slowly reduced its operations during the 1940s to manage the loans and homes it acquired in its key phase of activity.</p>",
			"<p>African Americans lambasted HOLC staffing decisions and infrastructure that favored white homeowners and businesses at the expense of blacks.  However, discussion in black newspapers, such as the <cite>Chicago Defender</cite>, prompted only modest response by policy and media elites.  The Roosevelt administration rebuffed NAACP concerns about restrictive covenants, even when HOLC redlining was exposed in 1938.  Black housing officials often worked incrementally on a host of issues, including ending white terrorism and getting new black housing built, even if that meant operating within the segregationist strictures of federal policy.  Racial segregation in housing was not formally deemed illegal until the Fair Housing Act of 1968.</p>",
			"<p>Scholars viewed HOLC favorably, shaped by economist C. Lowell Harriss’ <cite>History and Policies of the Home Owners’ Loan Corporation</cite>, published in 1951 as the federal government unwound the agency.  HOLC had refinanced a million homes and returned a profit of $14 million to the U.S. Treasury.  It was a successful business venture for an agency created as emergency relief that helped stabilize and even resurrect a moribund mortgage market and stagnant home building sector.</p>",
			"<p>In the 1980s discovery of the HOLC security maps changed the way historians thought about HOLC and New Deal housing policy.  Housing activists in the 1960s and 1970s had criticized and protested discrimination in real estate lending and buying, coining the term “redlining” to illustrate the geographic dimensions of housing discrimination.  Historian Kenneth Jackson found the maps in the National Archives, stating in his award-winning book <cite>Crabgrass Frontier</cite> that HOLC “devised a rating system that undervalued neighborhoods that were dense, mixed, or aging,” and rather than creating racial discrimination, “applied [existing] notions of ethnic and racial worth to real-estate appraising on an unprecedented scale.”  Federal housing policy simply blocked African Americans from accessing real estate capital, leading to the creation of segregated mass suburbia and, neighborhood by neighborhood, opened residents to opportunity and wealth accumulation or closed citizens off from the American dream.  Following Jackson’s work, historian Thomas Sugrue wrote of the legacy of federal housing policy in Detroit: “geography is destiny.”  Outside of history, scholars and journalists, including sociologist Douglas Massey and writer Ta-Nehisi Coates, point to HOLC redlining as a key factor in racial disparities in wealth and opportunity that continue to the present day.</p>",
			"<p>When historians incorporated new data technology in their research, they began to draw new conclusions about HOLC’s legacy.  Mapping with geographic information systems (GIS) and quantitative statistical methods from the social sciences, scholars including Amy Hillier and James Greer have countered Jackson’s initial assessment.  Some African Americans did gain access to HOLC financing, and a neighborhood rating was neither a blanket guarantee nor proscription for New Deal aid—“C” and “D”-rated neighborhoods often received more mortgages than nearby “A” neighborhoods.  The ability to work with digital data and to transmit information over the web has opened many new avenues for scholarly inquiry, including assessing the importance of restrictive covenants and asking research questions about the whole program, rather than just individual cities.  Managing massive amounts of real estate and demographic data has been a herculean task up until recently but is now possible with mapping, visualization, and statistical tools.</p>",
			"<p><cite>Mapping Inequality</cite> opens the HOLC files at the National Archives to scholars, students, and residents and policy leaders in local communities.  This site makes the well-known security maps of HOLC available in digital form, as well as the data and textual assessments of the area descriptions that were created to go with the maps.  By bringing study of HOLC into the digital realm, <cite>Mapping Inequality</cite> embraces a big data approach that can simultaneously give a national view of the program or a neighborhood-level assessment of the 1930s real estate rescue.  Project researchers are providing access to some of the digital tools and interactive resources they are using in their own research, in the hope that the public will be able to understand the effects of federal housing policy and local implementation in their own communities.</p>",
			"<h2>Bibliography</h2>",
			"<h3>Textbooks and Manuals on Home Appraisal and Valuation</h3>",
			"<ul>",
			"<li><cite>FHA Underwriting Manual</cite> (Washington, DC: Federal Housing Administration, 1936)</li>",
			"<li>Frederick Babcock, <cite>The Valuation of Real Estate</cite> (McGraw Hill Book Co.: New York, 1932).</li>",
			"<li>Richard Ely and George Wehrwein, <cite>Land Economics</cite> (Madison, WI: University of Wisconsin Press, rev. 1964).</li>",
			"<li>Ernest Fisher, <cite>Principles of Real Estate Practice</cite> (New York: The MacMillan Co., 1924).</li>",
			"<li>Richard Hurd, <cite>Principles of City Land Values </cite>(New York: The Record and Guide, 1924).</li>",
			"</ul>",
			"<h3>Contemporaneous Studies of HOLC and Racial Segregation</h3>",
			"<ul>",
			"<li>Charles Abrams, <cite>Forbidden Neighbors: A Study of Prejudice in Housing </cite>(New York: Harper &amp; Brothers, 1955).</li>",
			"<li>C. Lowell Harriss, <cite>History and Policies of the Home Owners&rsquo; Loan Corporation</cite> (Washington, D.C., National Bureau of Economic Research, 1951).</li>",
			"<li>Robert C. Weaver, <cite>The Negro Ghetto </cite>(New York: Harcourt, Brace, 1948).</li>",
			"</ul>",
			"<h3>Historical Studies of HOLC, Segregation, and Home Finance</h3>",
			"<ul>",
			"<li>David M. P. Freund, <cite>Colored Property: State Policy and White Racial Politics in Suburban America</cite> (Chicago: University of Chicago Press, 2007).</li>",
			"<li>Margaret Garb, <cite>City of American Dreams: A History of Home Ownership and Housing Reform in Chicago, 1871-1919</cite>.&nbsp; (Chicago: University of Chicago Press, 2005).</li>",
			"<li>Amy E. Hillier, &ldquo;Redlining and the Home Owners&rsquo; Loan Corporation,&rdquo; <cite>Journal of Urban History</cite> 29 (May 2003): 394-420.</li>",
			"<li>Amy E. Hillier, &ldquo;Residential Security Maps and Neighborhood Appraisals: The Home Owners&rsquo; Loan Corporation and the Case of Philadelphia,&rdquo; <cite>Social Science History</cite> 29, no. 2 (Summer 2005): 207-233.</li>",
			"<li>Amy E. Hillier, &ldquo;Searching for Red Lines: Spatial Analysis of Lending Patterns in Philadelphia, 1940-1960,&rdquo; <cite>Pennsylvania History</cite> 72, no. 1 (Winter 2005): 25-47.</li>",
			"<li>Hillier, Amy (2003), &ldquo;Who Received Loans? Home Owners' Loan Corporation Lending and Discrimination in Philadelphiain the 1930s,&rdquo; <cite>Journal of Planning History</cite> 2(1): 3-24.</li>",
			"<li>Arnold R. Hirsch, &ldquo;Containment on the Home Front: Race and Federal Housing Policy from the New Deal to the Cold War,&rdquo; <cite>Journal of Urban History</cite> 26, no. 2 (January 2000): 158-189</li>",
			"<li>Kenneth T. Jackson, &ldquo;Race Ethnicity, and Real Estate Appraisal: The Home Owners Loan Corporation and the Federal Housing Administration,&rdquo; <cite>Journal of Urban History</cite> 6, no. 4 (August, 1980): 419-452.</li>",
			"<li>Kenneth T. Jackson, <cite>Crabgrass Frontier: The Suburbanization of the United States</cite> (Oxford: Oxford University Press, 1985).</li>",
			"<li>Jennifer S. Light, &ldquo;Nationality and Neighborhood Risk at the Origins of FHA Underwriting,&rdquo; <cite>Journal of Urban History</cite> 36 (5): 634-671.</li>",
			"<li>Louis Lee Woods II, &ldquo;The Federal Home Loan Bank Board, Redlining, and the National Proliferation of Racial Lending Discrimination, 1921-1950,&rdquo; <cite>Journal of Urban History</cite>; Volume 38, Issue 6 (November 2012): 1036-1059.</li>",
			"</ul>",
			"<h3>Historical Community Studies Featuring Analysis of HOLC</h3>",
			"<ul>",
			"<li>Wendell Pritchett, <cite>Brownsville, Brooklyn: Blacks, Jews, and the Changing Face of the Ghetto </cite>(Chicago: University of Chicago Press, 2002).</li>",
			"<li>Beryl Satter, <cite>Family Properties: Race, Real Estate, and the Exploitation of Black Urban America</cite> (Metropolitan Books, 2009).</li>",
			"<li>Robert O. Self, <cite>American Babylon, Race and the Struggle for Postwar Oakland</cite> (Princeton: Princeton University Press, 2003).</li>",
			"<li>Thomas J. Sugrue, <cite>Origins of the Urban Crisis: Race and Inequality in Postwar Detroit</cite> (Princeton: Princeton University Press, 1996).</li>",
			"<li>Craig Steven Wilder, <cite>Covenant With Color: Race and Social Power in Brooklyn</cite> (New York: Columbia University Press, 2001).</li>",
			"</ul>",
			"<h3>Sociological Studies of Racial Discrimination and Segregation</h3>",
			"<ul>",
			"<li>Rose Helper, <cite>Racial Policies and Practices of Real Estate Brokers</cite>. (Minneapolis: University of Minnesota Press, 1969).</li>",
			"<li>Douglas S. Massey and Nancy A. Denton, <cite>American Apartheid: Segregation and the Making of the Underclass</cite> (Cambridge: Harvard University Press, 1993).</li>",
			"</ul>"
		],
		"burgess": [
			"<p><strong>Inspired by the 1920s-era \"concentric zones theory\" of Ernest W. Burgess, this interactive visualization offers a view of how redlining concentrated populations, and did so along a generally consistent pattern.</strong></p>",
			"<p>An urban sociologist of the extraordinarily influential Chicago School of Sociology, Burgess expounded this theory in a 1925 study <cite>The City</cite>. According to Burgess, every city developed as a series of concentric circles.  Downtown business districts would be surrounded by factory zones.  Factory zones would transition to slums, followed then by progressively more affluent housing for working people and the investor class, before then reaching the final zone, from whence commuters came into the city. As the historian Elaine Lewinnek points out, \"Burgess adapted a half-century of Chicago maps and codified them in a model of abstraction and urban theory that has been called&#8212;with some hyperbole&#8212;'the most famous diagram in social science.'\" (<cite>The Working Man’s Reward: Chicago’s Early Suburbs and The Roots of American Sprawl</cite> (Oxford, 2014), 130.)</p>",
			"<img src='./static/burgess.png' />",
			"<p>In Burgess's model, each ring had cultural and economic features&#8212;features that he explicitly associated with ethnic and racial populations. Recent immigrants and black migrants occupied central slum districts rife with vice dens and run down rooming houses.  Second-generation European immigrants and factory and a shop workers, \"skilled and thrifty,\" lived on the outer edge of the slums and on the inner edge of the ring of well-kept apartment houses and \"workingmen's homes.\" Beyond them was the \"Promised Land\" of residential hotels and single-family homes.  In contrast to the swarthy, congested slums, these were \"bright light areas\" safely protected by restrictive covenants and high price points.</p>",
			"<figure><img src='./static/burgess-chicago.png' /><figcaption>Burgess's theory was drawn from and applied to Chicago.</figcaption></figure>",
			"<p>Burgess's model, in addition to reflecting the homes of real estate investor communities, served as an extension of wider segregationist thinking driving both sociology as a discipline and administrative practice during the progressive era.  Obsession with cities as \"organisms\" of society, they believed in what the sociologist Louis Wirth benignly described as the \"eugenics of the city.\"</p>",
			"<p>Many of the HOLC maps reflected both the categorical impulse and spatial organization of Burgess model with D and C neighborhoods more likely to be located around central business districts and A and B neighborhoods in increasingly suburban peripheries. Many of the commercial maps HOLC colored to create the security maps had concentric circles on them that radiated out from the center of the city (for instance, <a {SLUG:fresno-ca}>Fresno</a>, Tampa, ) .</p>", 

			"<p>The diagram visualizes the relative distribution of HOLC grades in relation to the center of the city. The opacity of the rings reflects the relative density of zoned areas on the map. Hovering over the rings will highlight areas for that grade.</p>",
			"<p>Our adaptation of Burgess diagrams is not meant to resuscitate his discredited theory.  Rather, we aim to show just how profoundly segregationist practices of redlining actually shaped American cities to resemble a roundly discredited social theory.  Segregation was not natural.  Quite the contrary, redlining greatly impeded the natural flows of people and capital.  Through federal action and local manipulation, life was made to imitate art.</p>"
		],
		"about": [
			"<h2>Linking to and Citing <cite>Mapping Inequality</cite></h2>",
			"<p>The URL for <cite>Mapping Inequality</cite> updates to reflect the current map view, which city or neighborhood or area description is selected, any text that is open, etc. You can use those URLs to link to a particular view.</p>",
			"<p>You can also use those links for citations. We recommend the following format using the <cite>Chicago Manual of Style</cite>. Note the URL below reflects the current view.<p>",
			"<p style='margin: 0 25px 25px'>Robert K. Nelson, LaDale Winling, Richard Marciano, Nathan Connolly, et al., &ldquo;Mapping Inequality,&rdquo; <cite>American Panorama</cite>, ed. Robert K. Nelson and Edward L. Ayers, accessed {THE_DATE}, {THE_URL}.</p>",
			"<h2>Acknowledgments</h2>",
			"<p><cite>Mapping Inequality</cite> was created through the collaboration of three teams at four universities.</p>",
			"<p>At the <a href='//dsl.richmond.edu'>University of Richmond's Digital Scholarship Lab</a>, <strong>Justin Madron</strong> managed the data and metadata for the project and <strong>Nathaniel Ayers</strong> co-designed the map. The DSL's student interns contributed an enormous amount of labor to georeferencing HOLC maps, creating polygons, and transcribing area descriptions. They are <strong>Lily Calaycay</strong>, <strong>Beaumont Smith</strong>, <strong>Rebecca Tribble</strong>, <strong>Erica Ott</strong>, <strong>Barbie Savani</strong>, <strong>Radha Zanza</strong>, <strong>Zach Halaschak</strong>, <strong>Gavin Hosman</strong>, <strong>Stefan St. John</strong>, <strong>Donald Edmonds</strong>, <strong>Haley Fortner</strong>, <strong>Max Hoffman</strong>, <strong>Amanda Lineberry</strong>. <strong>Robert K. Nelson</strong> led the DSL team; he developed the application for <cite>Mapping Inequality</cite>, co-designed it, and contributed to its explanatory and interpretative text.</p>",
			"<p>At the University of Maryland, professor <strong>Richard Marciano</strong> from the Digital Curation Innovation Center (DCIC) at the College of Information Studies (\"Maryland's iSchool\"), has led an extended team of students.  Current students include <strong>Mary Kendig</strong>, <strong>Myeong Lee</strong>, <strong>Maddie Allen</strong>, <strong>Neha Chanchlani</strong>, <strong>Shaina Destine</strong>, <strong>Erin Durham</strong>, <strong>Darlene Reyes</strong>, <strong>Jacquelyn de la Torre</strong>, and <strong>Scott Harkless</strong>. This work builds on an earlier $250K IMLS-funded grant (LG-05-06-0158-06) called  <a href=''http://salt.umd.edu/T-RACES/>T-RACES (Testbed for the Redlining Archives of California's Exclusionary Spaces)</a> with <strong>David Goldberg</strong> at UC Irvine and <strong>Chien-Yi Hou</strong> at UNC Chapel Hill, which digitized, georeferenced, vectorized, and made the neighborhood descriptions for all the cities of California searchable through an online database and mapping interface.  It also builds on a 2013 NSF/OCI Grant (0848296) called Cyberinfrastructure for Billions of Electronic Records (CI-BER), a cooperative agreement between NSF and NARA, with <strong>Cathy Davidson</strong> and <strong>Robert Calderbank</strong> at Duke. </p>",
			"<p>At Virginia Tech, assistant professor of history <strong>LaDale Winling</strong> led a team of graduate and undergraduate students who conducted research at the National Archives; georeferenced maps and created polygons; and transcribed area descriptions.  These included <strong>Mason Ailstock</strong>, <strong>Carmen Bolt</strong>, <strong>Victoria Fowler</strong>, <strong>Claire Gogan</strong>, <strong>Jordan Hill</strong>, <strong>Andrea Ledesma</strong>, <strong>Rachel Snyder</strong>, <strong>Sydney Vaile</strong>, and <strong>Rebecca Williams</strong>, along with students in two classes.  Winling is an urban and digital historian and his forthcoming book, <cite>Building the Ivory Tower</cite>, will be published by the University of Pennsylvania Press.</p>",
			"<p><strong>N. D. B. Connolly</strong>, the Herbert Baxter Adams Associate Professor of History at the Johns Hopkins University and the author of <cite>A World More Concrete: Real Estate and the Remaking of Jim Crow South Florida</cite>, contributed his expertise in the history of race and urban America to the conceptualization and development of <cite>Mapping Inequality</cite>, particularly its textual elements.</p>",
			"<p>We would like to thank a number of individuals and groups. <strong>Bobby Allen</strong>, <strong>Pam Lach</strong>, and <strong>Claire Clements</strong> with Nelson and Marciano inventoried the HOLC files at the National Archives at College Park. Special thanks to <strong>Cathy Davidson</strong>, distinguished professor and director of the Futures Initiative and HASTAC@CUNY, for her team's support of T-RACES at Duke University with HASTAC Director of Social Networking, <strong>Sheryl Grant</strong>, which led to the expansion of the project to the cities of North Carolina and use in a Bass Connections \"Information, Society, and Culture\" interdisciplinary research theme with <strong>Robert Calderbank</strong> at Duke University and <strong>Molly Tamarkin</strong> (now Library Director at KAUST in Saudi Arabia), with the participation of Asheville community leader <strong>Priscilla Ndiaye</strong>, and students <strong>Rachel Anderson</strong>, <strong>Felicia Arriaga</strong>, <strong>Yue Dai</strong>, and <strong>Lalita Maraj</strong>. Great appreciation to <strong>Keith Pezzoli</strong>, director of the Urban Studies and Planning Program at UC San Diego, for years of early encouragement and championing of T-RACES through the USP program from 2000 to 2006.  That redlining work was first developed with <strong>Rosemarie McKeon</strong> and presented at the ESRI User Conference in San Diego in 1999 through a poster exhibit called \"The Balkanization of Urban San Diego\" and subsequently in 2000 as a touring art exhibit led by <strong>Rosemarie McKeon,</strong> called \"Tolerance Zone\",  with <strong>Carrol Waymon</strong>, <strong>Poyin Tse</strong>, and <strong>Midi Cox</strong>. Thanks as well to <strong>John Moeser</strong> who inspired <a href='http://dsl.richmond.edu/holc/'>\"Redlining Richmond,\"</a> an important antecedent to <cite>Mapping Inequality</cite>. Finally, <a href='//stamen.com/'>Stamen Design</a> developed the <a href='//github.com/americanpanorama/panorama'>Panorama toolkit</a>, components of which are used in <strong>Mapping Inequality</strong>. </p>",
			"<p>The <a href='//mellon.org'>Andrew W. Mellon Foundation</a> provided the DSL generous funding to work on this and the other initial maps of <cite><a href='//dsl.richmond.edu/panorama'>American Panorama</a></cite>. The Virginia Tech College of Liberal Arts and Human Sciences also provided some funding for site development.</p>"

		]
	},

	setShow: function (subject) {
		this.data.modal = {
			open: (subject !== null),
			subject: subject
		}
		this.emit(AppActionTypes.storeChanged);
	},

	getModalContent: function() {
		return (this.data.modal.open) ? this.parseModalCopy(this.data[this.data.modal.subject]) : null;
	},

	getSubject: function () {
		return this.data.modal.subject;
	},

	mainModalIsOpen: function() {
		return this.data.modal.open;
	},

	parseModalCopy (rawContent) {
		let modalCopy = '';

		try {
			modalCopy = rawContent.join('\n');

			// replace the date
			const objToday = new Date(),
				months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
			modalCopy = modalCopy.replace('{THE_DATE}', months[objToday.getMonth()] + ' ' + objToday.getDate() + ', ' + objToday.getFullYear());

			// replace the URL
			modalCopy = modalCopy.replace('{THE_URL}', window.location.href);
		} catch (error) {
			console.warn('Error parsing modal copy: ' + error);
			modalCopy = 'Error parsing modal copy.';
		}

		// React requires this format to render a string as HTML,
		// via dangerouslySetInnerHTML.
		return {
			__html: modalCopy
		};
	}

}

// Mixin EventEmitter functionality
Object.assign(TextsStore, EventEmitter.prototype);

// Register callback to handle all updates
AppDispatcher.register((action) => {

	switch (action.type) {

		case AppActionTypes.loadInitialData:
			if (action.hashState.text) {
				TextsStore.setShow(action.hashState.text);
			}
			break;

		case AppActionTypes.onModalClick:
			// toggle of when the same text is requested
			TextsStore.setShow((action.subject !== TextsStore.getSubject()) ? action.subject : null);
			break;

	}
	return true;
});

export default TextsStore;