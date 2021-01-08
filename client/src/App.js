import React, { Component } from 'react';
import Simulator from './Simulator.js';

import './App.css'
class App extends Component {
	constructor(props) {
	  super(props)
		this.state = { 
			settings: {
				producer: { backlog: 650, createRate: 0, produceRate: 15 },
				partition: { maxReceiveRate: 3, maxTransmitRate: 3 },
				consumer: { consumeRate: 4 },
				partitionBalanceStrategy: 'round-robin',
				showSettings: true,
				layout: {
					numProducers: 3,
					numPartitions: 7,
					numConsumers: 3
				},
				maxTicks: 200,
				tickMs: 66
			},
		}
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
			<Simulator {...{
				settings: this.state.settings
			}} />
		</div>
    );
  }
}

export default App;
