import React, { Component } from 'react';
import KSim from './ksim/KSim.js';

import './App.css'
class App extends Component {
	constructor(props) {
	  super(props)
		this.state = { }
	}
  componentDidMount() {
    
  }

  componentWillUnmount() {
  }

  render () {
  	return (
		<div className="App">
		    <h1>k-sim: Kafka Failover/Throughput Simulator</h1>
			<p>A simple simulator designed to explore bottlenecking and throughput scenarios.  Written with Kafka fundamentals in mind, there's no reason why this shouldn't apply to other queuing technologies.</p>
			<KSim />
		</div>
    );
  }
}

export default App;
