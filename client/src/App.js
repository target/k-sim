import React, { Component } from 'react';
import Producer from './Producer.js';
import Partition from './Partition.js';
import Consumer from './Consumer.js';


class App extends Component {
	// constructor(props) {
		// super(props)
		// this.state = {
			// something: "Nothing"
		// }
// 
	// }
  producerBurst = () => {
		
	}

  render () {
  	return (
      <div className="App">
		    <h1>k-sim: Kafka Failover/Throughput Simulator</h1>
				<p>A simple simulator designed to explore bottlenecking and throughput scenarios.  Written with Kafka fundametnals in mind, there's no reason why this shouldn't apply to other queuing technologies.</p>
			<button onClick={this.producerBurst(10)}>producer burst(10)</button>
			<Producer />
			<Partition />
			<Consumer />
			</div>
    );
  }
}

export default App;
