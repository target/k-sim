import React, { Component } from 'react';
import Simulator from './Simulator.js';


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
				<p>A simple simulator designed to explore bottlenecking and throughput scenarios.  Written with Kafka fundametnals in mind, there's no reason why this shouldn't apply to other queuing technologies.</p>
			  <Simulator {...{numProducers: 20, numPartitions: 7, numConsumers: 3}} />
			</div>
    );
  }
}

export default App;
