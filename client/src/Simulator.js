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
				createRate: 0,
				produceRate: 2,
				lastDestPartition: 0,
				produceStrategy: "tick-next-with-overflow" //advances the partition every tick, and also on cases of overflow
			})
		}

		const initialPartitions = []
		for (let aId = 0; aId < props.numPartitions ; aId++  ) {
			initialPartitions.push({
				partitionId: aId,
				maxOffset: 0,
				receivedThisTick: 0,
				maxReceiveRate: 10,  
				transmittedThisTick: 0,
				maxTransmitRate: 10  
			})
		}

		const initialConsumers = []
		const partitionBalance = this.getPartitionBalance('round-robin', props.numPartitions, props.numConsumers)

		for (let cId = 0; cId < props.numConsumers ; cId++  ) {
			let srcPartitions = []
			for (let aId of partitionBalance[cId].values()) {
				srcPartitions.push({partitionId: aId, currentOffset: 0 })
			}
			initialConsumers.push({
				consumerId: cId,
				consumeRate: 4,
				srcPartitions: srcPartitions
			})
		}

		let finalState = {
			tickNumber: 0,
			maxTicks: 100,
			running: false,
			tickIntervalId: null,
			tickMs: 150,
			producers: initialProducers,
			partitions: initialPartitions,
			consumers: initialConsumers
		}

		console.log("Initialized simulator with this state:")
		console.log(finalState)
		this.state = finalState;
	}

	getPartitionBalance(strategy, numPartitions, numConsumers) {
		strategy = 'round-robin' // only current supported strategy

		//console.log("gPB input: ", strategy, numPartitions, numConsumers)
		let partitionBalance = []

		if (strategy === 'round-robin') {
			//console.log("attempt to apply round-robin")
			for (let cId = 0; cId < numConsumers; cId++ ) {
				//console.log("apply for consumer: " + cId)
				let aId = cId
				let myPartitions = []
				while (aId < numPartitions) {
					myPartitions.push(aId)
					aId = aId + numConsumers
				}
				//console.log(myPartitions)
				partitionBalance.push(myPartitions)
			}

		} else {
			console.log("ERROR: Unknown partition balance strategy: " + strategy)
		}
		//console.log("pB result: ", partitionBalance)
		return(partitionBalance)
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

	partitionAvailReceive(a, n) {
		if (n <= 0) {
			// console.log("Partition " + a.partitionId + "ignoring ask for " + n + " receive!")
			return 0 //Whatever, you ask for negative, we give you zero.
		}

		if (a.maxReceiveRate === a.receivedThisTick) {
			// console.log("Partition " + a.partitionId + " receive blocked!")
			return 0
		}

		if (a.maxTransmitRate > (a.transmittedThisTick + n)) {
			return n
		} else {
			// console.log("Partition " + a.partitionId + " receive over-demand!")
			return (a.maxReceiveRate - a.ReceivedThisTick) // Give up the rest
		}
	}

	partitionAvailTransmit(a, n) {
		if (n <= 0) {
			//console.log("Partition " + a.partitionId + "ignoring ask for " + n + " transmit!")
			return 0 //Whatever, you ask for negative, we give you zero.
		}

		if (a.maxTransmitRate === a.transmittedThisTick) {
			//console.log("Partition " + a.partitionId + " transmit blocked!")
			return 0
		}

		if (a.maxTransmitRate > (a.transmittedThisTick + n)) {
			return n
		} else {
			//console.log("Partition " + a.partitionId + " transmit over-demand!")
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
			let destPartitionId = p.lastDestPartition  // IMPORTANT: each producer will have it's own choices about destination
			// 1a: create new records for the local backlog
			p.backlog = p.backlog + p.createRate

			// 1b: calculate demand and resuling n
			let demand = Math.min(p.produceRate, p.backlog)
			let n = this.partitionAvailReceive(newPartitions[destPartitionId], demand)

			// 1c: apply produce
			if (n > 0) {
				newPartitions[destPartitionId].maxOffset = newPartitions[destPartitionId].maxOffset + n
				newPartitions[destPartitionId].receivedThisTick = newPartitions[destPartitionId].receivedThisTick + n
				p.backlog = p.backlog - n
			}

			// 1d: rollforward overflow
			if (demand > n) { 
				console.log("retry for ", p)
				let numRetries = newPartitions.length / 3
				let r = 1
				while ( (r < numRetries) && (demand > 0) ) {
					destPartitionId++
					if(destPartitionId >= newPartitions.length) { destPartitionId = 0 }
					demand = demand - n
					n = this.partitionAvailReceive(newPartitions[destPartitionId], demand)
					if (n > 0) {
						newPartitions[destPartitionId].maxOffset = newPartitions[destPartitionId].maxOffset + n
						newPartitions[destPartitionId].receivedThisTick = newPartitions[destPartitionId].receivedThisTick + n
						p.backlog = p.backlog - n
					}
				}
				p.lastDestPartition = destPartitionId
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
						let n = Math.min( consumeCap, this.partitionAvailTransmit(newPartitions[a.partitionId], avail) )
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
			pComps.push(<Producer backlog={p.backlog} key={"Producer-"+p.producerId}/>)
		}

		const aComps = []
		for (const a of this.state.partitions.values()) {
			aComps.push(<Partition maxOffset={a.maxOffset} key={"Partition-"+a.partitionId}  />)
		}

		const cComps = []
		for (const c of this.state.consumers.values()) {
			//FIXME: Consumer needs rework to support multiple partitions per consumer
			cComps.push(<Consumer partitions={this.state.partitions} c={c} key={"Consumer-"+c.consumerId}/>)
		}

		return(
			<div className="kSim">
				<div className="ticker"> 
				  {this.state.running ? 'run' : 'STOP'} 
					({this.state.tickNumber}/{this.state.maxTicks}) 
				</div>
				<h2>Producers</h2>
				{pComps}
				<h2>Partitions</h2>
				{aComps}
				<h2>Consumers</h2>
				{cComps}
			</div>
		);
	}
}

export default Simulator;
