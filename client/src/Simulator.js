import React from 'react';

import { cloneDeep } from "lodash" // Because I am a horrible monster who can't be bothered to write my own

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
					receivedThisTick: 0,
          maxReceiveRate: 100,  // Limitless
					transmittedThisTick: 0,
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

	partitionCanReceive(a, n) {
		if (a.maxReceiveRate > (a.receivedThisTick + n)) {
			return true
		} else {
			console.log("Partition {a} blocked!")
			return false
		}
	}

  tick() {
		// It's wasteful, but we can optimize for speed by using a real language later.
		var newProducers = cloneDeep(this.state.producers)
		var newPartitions = cloneDeep(this.state.partitions)
		var newConsumers = cloneDeep(this.state.consumers)

		// Initialize the rate data
		for (let a of newPartitions) {
			a.receivedThisTick = 0
			a.transmittedThisTick = 0
		}

		// Step 1: Create and Produce!
		for (let p of newProducers) {
			var destPartitionId = 0  // IMPORTANT: each producer will have it's own choices about destination
			// 1a: create new records for the local backlog
			p.backlog = p.backlog + p.createRate

			var n = p.produceRate
			// 1b: attempt to produce the whole produceRate (no partial produces here)
			if (this.partitionCanReceive(newPartitions[destPartitionId], n)) {
				newPartitions[destPartitionId].maxOffset = newPartitions[destPartitionId].maxOffset + n
				newPartitions[destPartitionId].receivedThisTick = newPartitions[destPartitionId].receivedThisTick + n
				p.backlog = p.backlog - n
			}
		}

		// Step 2: Consume!
		//TODO:

		this.setState({
			...this.state,
			tickNumber: this.state.tickNumber + 1,
			producers: newProducers,
			partitions: newPartitions,
			consumers: newConsumers
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
