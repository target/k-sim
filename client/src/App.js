import React, { Component } from 'react';
import Simulator from './Simulator.js';


class App extends Component {
	constructor(props) {
	  super(props)
		this.state = { 
			settings: {
				producer: { backlog: 9, createRate: 3, produceRate: 3 },
				partition: { maxReceiveRate: 11, maxTransmitRate: 11 },
				consumer: { consumeRate: 5 },
				partitionBalanceStrategy: 'round-robin',
				showSettings: true,
				layout: {
					numProducers: 5,
					numPartitions: 5,
					numConsumers: 4
				}
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
				// numProducers: this.state.layout.numProducers, 
				// numPartitions: this.state.layout.numPartitions, 
				// numConsumers: this.state.layout.numConsumers,
				settings: this.state.settings
			}} />
		</div>
    );
  }
}

export default App;
