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
				layout: {
					numProducers: 1,
					numPartitions: 1,
					numConsumers: 1
				},
				partitionBalanceStrategy: 'round-robin',
				general: {
					tickNumber: 1,
					maxTicks: 200,
					tickMs: 66
				},
				showSettings: true
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
