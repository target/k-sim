import React from 'react';

import { cloneDeep } from "lodash" // Because I am a horrible monster who can't be bothered to write my own

import Producer from './Producer.js';
import Partition from './Partition.js';
import Consumer from './Consumer.js';

class Simulator extends React.Component {
	constructor(props) {
		super();
		const initialProducers = []
		for (let pId = 0; pId < props.numProducers ; pId++  ) {
			initialProducers.push({
				producerId: pId,
				backlog: 100,
				createRate: 7,
				produceRate: 12
			})
		}

		const initialPartitions = []
		for (let aId = 0; aId < props.numPartitions ; aId++  ) {
			initialPartitions.push({
				partitionId: aId,
				maxOffset: 0,
				receivedThisTick: 0,
				maxReceiveRate: 1000,  // Limitless
				transmittedThisTick: 0,
				maxTransmitRate: 1000  // Well, pretty much limitless
			})
		}

		const initialConsumers = []
		for (let cId = 0; cId < props.numConsumers ; cId++  ) {
			initialConsumers.push({
				consumerId: cId,
				consumeRate: 34,
				srcPartitions: [ {partitionId: cId, currentOffset: 0 } ]  //TODO: algorithmically assign this
			})
		}


		this.state = {
      tickNumber: 0,
			maxTicks: 1000,
			running: false,
			tickIntervalId: null,
			tickMs: 150,
      producers: initialProducers,
      partitions: initialPartitions,
      consumers: initialConsumers
		};
  }

	componentDidMount() {
		// should we roll this into the setState statement?
		var tickIntervalId = setInterval(
			() => this.tick(),   // It is unclear to me why I needed the () => here... but it only works that way!
			this.state.tickMs
		);  
		this.setState({
			...this.state,
			tickIntervalId: tickIntervalId,
			running: true
		});
	}

	componentWillUnmount() {
		clearInterval(this.state.tickIntervalId) // Clean up our mess
	}

	partitionCanReceive(a, n) {
		if (a.maxReceiveRate > (a.receivedThisTick + n)) {
			return true
		} else {
			console.log("Partition {a} receive blocked!")
			return false
		}
	}

	partitionAvailTransmit(a, n) {
		if (n <= 0) {
			console.log("Partition {a} asked for 0 or negative transmit!")
			return 0 //Whatever, you ask for negative, we give you zero.
		}

		if (a.maxTransmitRate === a.transmittedThisTick) {
			console.log("Partition {a} transmit blocked!")
			return 0
		}

		if (a.maxTransmitRate > (a.transmittedThisTick + n)) {
			return n
		} else {
			console.log("Partition {a} transmit over-demand!")
			return (a.maxTransmitRate - a.transmittedThisTick) // Give up the rest
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
			let destPartitionId = 0  // IMPORTANT: each producer will have it's own choices about destination
			// 1a: create new records for the local backlog
			p.backlog = p.backlog + p.createRate

			let n = Math.min(p.produceRate, p.backlog)
			// 1b: attempt to produce the whole produceRate (no partial produces here)
			if (this.partitionCanReceive(newPartitions[destPartitionId], n)) {
				newPartitions[destPartitionId].maxOffset = newPartitions[destPartitionId].maxOffset + n
				newPartitions[destPartitionId].receivedThisTick = newPartitions[destPartitionId].receivedThisTick + n
				p.backlog = p.backlog - n
			}
		}

		// Step 2: Consume!
		for (let c of newConsumers) {
			let consumeCap = c.consumeRate
			for (let a of c.srcPartitions) { //TODO:  What to do if there wasn't enough drain capacity? shuffle?
				let avail = (newPartitions[a.partitionId].maxOffset - a.currentOffset)
				if (avail < 0) { 
					// Shouldn't be here!
					console.log("ERROR: Consumer {c} on {p} is in an impossible place?")
				} else {
					if (consumeCap <= 0) {
						console.log("Consumer {c} does not have *any* capacity to service {avail} waiting records on {a}")
					} else {
						//// Attempt to get the maxiumum available transfer or all the available records
						let n = Math.min( avail, this.partitionAvailTransmit(newPartitions[a.partitionId], consumeCap) )
						a.currentOffset = a.currentOffset + n
						newPartitions[a.partitionId].transmitThisTick = newPartitions[a.partitionId] - n
						consumeCap = consumeCap - n
					}
				}
			}
		}

		var newRunning = this.state.running
		if (this.state.tickNumber > this.state.maxTicks) {
			clearInterval(this.state.tickIntervalId)
			newRunning = false
		}

		this.setState({
			...this.state,
			running: newRunning,
			tickNumber: this.state.tickNumber + 1,
			producers: newProducers,
			partitions: newPartitions,
			consumers: newConsumers
		});
		
  }


	render() {
		const pComps = []
		for (const p of this.state.producers.values()) {
			pComps.push(<Producer backlog={p.backlog} />)
		}

		const aComps = []
		for (const a of this.state.partitions.values()) {
			aComps.push(<Partition maxOffset={a.maxOffset} />)
		}

		const cComps = []
		for (const c of this.state.consumers.values()) {
			//FIXME: Consumer needs rework to support multiple partitions per consumer
			cComps.push(<Consumer currentOffset={c.srcPartitions[0].currentOffset} />)
		}

		return(
			<div className="kSim">
				<div className="ticker"> 
				  {this.state.running ? 'run' : 'STOP'} 
					({this.state.tickNumber}/{this.state.maxTicks}) 
				</div>
				{pComps}
				{aComps}
				{cComps}
			</div>
		);
	}
}

export default Simulator;
