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

  tick() {
    
  }

  producerBacklogAdd = () => {
	}

  render () {
  	return (
      <div className="App">
		    <h1>k-sim: Kafka Failover/Throughput Simulator</h1>
				<p>A simple simulator designed to explore bottlenecking and throughput scenarios.  Written with Kafka fundametnals in mind, there's no reason why this shouldn't apply to other queuing technologies.</p>
			  <button onClick={this.producerBacklogAdd(10)}>sudden producer backlog (10)</button>
			  <Simulator />
			</div>
    );
  }
}

export default App;
