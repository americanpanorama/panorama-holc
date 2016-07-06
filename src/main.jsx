import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';

//process.env.NODE_ENV = 'development';
//import Perf from 'react-addons-perf';
//window.Perf = Perf;

//Perf.start();

ReactDOM.render(<App/>, document.getElementById('app-container'));
//Perf.stop();
//Perf.printWasted();