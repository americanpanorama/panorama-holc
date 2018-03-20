import React, { PropTypes } from 'react';

/**
 * The new (Summer 2016) intro modal.
 * This is distinct from the IntroManager "intro",
 * which acts more like a series of walkthrough overlays.
 */
export default class IntroModal extends React.Component {

	constructor (props) {

		super(props);

		this.dismissIntro = this.dismissIntro.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);

		this.state = this.getDefaultState();

	}

	componentWillMount () {

		let img = new Image(),
			onload = (event) => {
				img.removeEventListener('load', onload);
				this.setState({
					coverImgLoaded: true
				});
			};

		img.addEventListener('load', onload);
		img.src = IntroModal.coverImgPath;

	}

	getDefaultState () {

		return {
			pageIndex: 0
		};

	}

	setPage (pageIndex) {

		pageIndex = Math.max(0, Math.min(pageIndex, 1));
		this.setState({
			pageIndex
		});

	}

	dismissIntro () {

		if (this.props.onDismiss) this.props.onDismiss(this.refs.muteIntroInput.checked);

	}

	handleInputChange () {

		this.refs.muteIntroLabel.classList.toggle('checked', this.refs.muteIntroInput.checked);

	}



	// ============================================================ //
	// Lifecycle
	// ============================================================ //

	render () {

		if (this.state.pageIndex === 0) {

			return (
				<div className='intro-modal'>
					<div className='page p0'>
						<div className='title-block'>
							<h1>Mapping Inequality</h1>
							<h3>Redlining in New Deal America</h3>
						</div>
						<img 
							src={ './static/the_hill_pittsburg.png' } 
							className={ this.state.coverImgLoaded ? '' : 'loading' } 
							title='Arthur Rothstein, "Houses on The Hill slum section, Pittsburg, Pennsylvania," July 1938'
						/>
						<p><cite>Mapping Inequality</cite> introduces viewer to the records of the Home Owners' Loan Corporation on a scale that is unprecedented. Here you can browse more than 150 interactive maps and thousands of "area descriptions." These materials afford an extraordinary view of the contours of wealth and racial inequality in Depression-era American cities and insights into discriminatory policies and practices that so profoundly shaped cities that we feel their legacy to this day.</p>
						<div className='intro-modal-button' onClick={ () => this.setPage(1) }>Next</div>
					</div>
				</div>
			);

		} else {

			return (
				<div className='intro-modal'>
					<div className='page p1'>
						<div className='title-block'>
							<h3>how to use</h3>
							<h2>this map</h2>
						</div>
						<div className='content'>
							<ol>
								<li>
									<div className='ordinal'>1</div>
									<div className='item'>
										<p className='no-margin'>Explore over 150 redlining maps using either the past or current roads</p>
										<img src='./static/modal1.png' />
									</div>
								</li>
								<li className='wider'>
									<div className='ordinal'>2</div>
									<div className='item'>
										<p>Select a neighborhood to read its "area description"</p>
										<img src='./static/modal2.png' />
									</div>
								</li>
								<li>
									<div className='ordinal descender'>3</div>
									<div className='item'>
										<p className='no-margin'>Use the visualization to explore the spatial organization of inequality</p>
										<img src='./static/modal3.png' />
									</div>
								</li>
								<li className='wider'>
									<div className='ordinal descender'>4</div>
									<div className='item'>
										<p>Download HOLC maps and data</p>
										<img src='./static/modal4.png' />
									</div>
								</li>
							</ol>
						</div>
						<p className='map-desc'></p>
						<div className='intro-modal-button' onClick={ this.dismissIntro }>Enter</div>
						<div className='footer'>
							<div onClick={ () => this.setPage(0) }>&lt; back</div>
							<label onChange={ this.handleInputChange } ref='muteIntroLabel'><input type='checkbox' ref='muteIntroInput' />do not show again</label>
						</div>
					</div>
				</div>
			);

		}

	}

}
