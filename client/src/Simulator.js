import React from 'react';
import Producer from './Producer.js';
import Partition from './Partition.js';
import Consumer from './Consumer.js';

class Simulator extends React.Component {
	constructor() {
		super();
		this.state = {
      tickNumber: 0,
			maxTicks: 100,
			running: false,
			tickIntervalId: null,
			tickMs: 750,
      producers: [ { 
          producerId: 0,
          backlog: 1000,
          createRate: 1,
          produceRate: 3
        } 
      ],
      partitions: [ {
          partitionId: 0,
          maxOffset: 0,
          maxReceiveRate: 100,  // Limitless
          maxTransmitRate: 100  // Well, pretty much limitless
        }
      ],
      consumers: [ {
          consumerId: 0,
          currentOffset: 0,
          consumeRate: 2
        }
      ],
		};
  }

	componentDidMount() {
		// should we roll this into the setState statement?
		var tickIntervalId = setInterval(
			() => this.tick(),   // It is unclear to me why I needed the () => here... but it only works that way!
			this.state.tickMs);  
		this.setState({
			...this.state,
			tickIntervalId: tickIntervalId,
			running: true
		})
	}

	componentWillUnmount() {
		clearInterval(this.state.tickIntervalId) // Clean up our mess
	}

  tick() {
		this.setState({
			...this.state,
			tickNumber: this.state.tickNumber + 1
		})
  }

	render() {
		return(
			<div className="kSim">
				<div className="ticker"> {this.state.tickNumber}/{this.state.maxTicks} run:{this.state.running} </div>
        <Producer backlog={this.state.producers[0].backlog} />
        <Partition maxOffset={this.state.partitions[0].maxOffset} />
        <Consumer currentOffset={this.state.consumers[0].currentOffset} />
      </div>
		);
	}
}

export default Simulator;
