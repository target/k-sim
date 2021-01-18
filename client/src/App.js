import React, { Component } from 'react';
import Simulator from './Simulator.js';

import './App.css'
class App extends Component {
	constructor(props) {
	  super(props)
		this.state = { 
			settings: {
				producer: { backlog: 0, createRate: 10, produceRate: 10 },
				partition: { maxReceiveRate: 100, maxTransmitRate: 100 },
				consumer: { consumeRate: 7 },
				layout: {
					numProducers: 1,
					numPartitions: 1,
					numConsumers: 1
				},
				partitionBalanceStrategy: 'round-robin',
				general: {
					tickNumber: 1,
					maxTicks: 10000,
					tickMs: 66
				},
				showSettings: true,
				selectedObj: null
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
