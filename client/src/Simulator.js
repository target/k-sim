import React from 'react';
import Producer from './Producer.js';
import Partition from './Partition.js';
import Consumer from './Consumer.js';

class Simulator extends React.Component {
	constructor() {
		super();
		this.state = {
      tickNumber: 0,
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

  tick() {
  }

	render() {
		return(
			<div className="kSim">
        <Producer backlog={this.state.producers[0].backlog} />
        <Partition maxOffset={this.state.partitions[0].maxOffset} />
        <Consumer currentOffset={this.state.consumers[0].currentOffset} />
      </div>
		);
	}
}

export default Simulator;
