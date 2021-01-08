import React from 'react';

import { cloneDeep } from "lodash" // Because I am a horrible monster who can't be bothered to write my own

import Producer from './Producer.js';
import Partition from './Partition.js';
import Consumer from './Consumer.js';
import SimulatorSettings from './SimulatorSettings.js';

import './Simulator.css'

class Simulator extends React.Component {
	constructor(props) {
		super();
		this.state = {
			settings: props.settings,
			producers: [],
			partitions: [],
			consumers: []
		}
		this.initializeSimulator()
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
		//this.startTickInterval()
	}

	componentWillUnmount() {
		this.clearTickInterval() // Clean up our mess
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

		if (a.maxTransmitRate > (a.receivedThisTick + n)) {
			return n
		} else {
			// console.log("Partition " + a.partitionId + " receive over-demand!")
			return (a.maxReceiveRate - a.receivedThisTick) // Give up the rest
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
			destPartitionId++
			if(destPartitionId >= newPartitions.length) { destPartitionId = 0 }
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
				//console.log("retry for ", p)
				let numRetries = 3 //newPartitions.length 
				let r = 1
				while ( (r < numRetries) && (demand > 0) ) {
					destPartitionId += Math.floor(Math.random()*newPartitions.length) //+ p.producerId //"randomly" skip around
					destPartitionId = destPartitionId % newPartitions.length 
					demand = demand - n
					n = this.partitionAvailReceive(newPartitions[destPartitionId], demand)
					if (n > 0) {
						newPartitions[destPartitionId].maxOffset = newPartitions[destPartitionId].maxOffset + n
						newPartitions[destPartitionId].receivedThisTick = newPartitions[destPartitionId].receivedThisTick + n
						p.backlog = p.backlog - n
					}
					r++
				}
			}
			p.lastDestPartition = destPartitionId
		}

		// Step 2: Consume!
		for (let c of newConsumers) {
			let consumeCap = c.consumeRate
			let totalOffsets = 0
			for (let a of c.srcPartitions) { //TODO:  What to do if there wasn't enough drain capacity? shuffle?
				let avail = (newPartitions[a.partitionId].maxOffset - a.currentOffset)
				if (avail < 0) { 
					// Shouldn't be here!
					//console.log("ERROR: Consumer {c} on {p} is in an impossible place?")
				} else {
					if (consumeCap <= 0) {
						//console.log("Consumer {c} does not have *any* capacity to service {avail} waiting records on {a}")
					} else {
						//// Attempt to get the maxiumum available transfer or all the available records
						let n = Math.min( consumeCap, this.partitionAvailTransmit(newPartitions[a.partitionId], avail) )
						a.currentOffset = a.currentOffset + n
						newPartitions[a.partitionId].transmitThisTick = newPartitions[a.partitionId] - n
						consumeCap = consumeCap - n

					}
				}
				totalOffsets = totalOffsets + a.currentOffset // BUG: Not exactly true, but whatever, we don't rebalance
			}
			c.totalOffsets = totalOffsets
		}

		this.setState({
			...this.state,
			tickNumber: this.state.tickNumber + 1,
			producers: newProducers,
			partitions: newPartitions,
			consumers: newConsumers
		});
		
		if (this.state.tickNumber > this.state.maxTicks - 1) {
			this.stopSimulator()
		}
	}

	clearTickInterval() {
		clearInterval(this.state.tickIntervalId)
		this.setState({
			...this.state,
			tickIntervalId: null
		})
	}

	startTickInterval() {
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

	stopSimulator() {
		this.setState({
				...this.state,
				running: false,
			},
			this.clearTickInterval //Callback to clear our interval timer
		)
	}

	resumeSimulator() {
		if (! this.state.running) {
			if (this.state.tickIntervalId == null) {
				this.startTickInterval()
			}
		}
	}

	initializeSimulator() {
		let numProducers = this.state.settings.layout.numProducers
		let numPartitions = this.state.settings.layout.numPartitions
		let numConsumers = this.state.settings.layout.numConsumers

		const initialProducers = []
		for (let pId = 0; pId < numProducers ; pId++  ) {
			const newProducer = {
				producerId: pId,
				backlog: 0,
				createRate: 1,
				produceRate: 1,
				lastDestPartition: 0,
				produceStrategy: "tick-next-with-overflow" //advances the partition every tick, and also on cases of overflow
			}
			initialProducers.push({...newProducer, ...this.state.settings.producer})
		}

		const initialPartitions = []
		for (let aId = 0; aId < numPartitions ; aId++  ) {
			const newPartition = {
				partitionId: aId,
				maxOffset: 0,
				receivedThisTick: 0,
				maxReceiveRate: 1,  
				transmittedThisTick: 0,
				maxTransmitRate: 1  
			}
			initialPartitions.push({ ...newPartition, ...this.state.settings.partition })
		}

		const initialConsumers = []
		const partitionBalance = this.getPartitionBalance('round-robin', numPartitions, numConsumers)

		for (let cId = 0; cId < numConsumers ; cId++  ) {
			let srcPartitions = []
			for (let aId of partitionBalance[cId].values()) {
				srcPartitions.push({partitionId: aId, currentOffset: 0 })
			}
			const newConsumer = {
				consumerId: cId,
				consumeRate: 1,
				srcPartitions: srcPartitions,
				totalOffsets: 0
			}
			initialConsumers.push({...newConsumer, ...this.state.settings.consumer})
		}

		const finalState = {
			tickNumber: 1,
			maxTicks: (this.state.settings.maxTicks ? this.state.settings.maxTicks : 100),
			running: false,
			tickIntervalId: null,
			tickMs: Math.max(this.state.settings.tickMs, 50),
			producers: initialProducers,
			partitions: initialPartitions,
			consumers: initialConsumers,
			initialized: true
		}

		console.log("Initialized simulator with this state:")
		console.log(finalState)
		this.setState({
			...this.state,
			...finalState
		});
		//TODO

	}

	render() {
		let svgDim = {
			width: 600,
			height: 600
		}
		let partitionSvgLayout = {
			w: 400,
			h: 500,
			tr: {
				x: 100, // (600 - 400) / 2
				y: 100, // (600 - 500)
			},
			rectMargin: 20 //Only on the X-axis, they are full-heighted
		}
		let partitionRectangles = [] // Data describing the rectangle of the thing
		let rectX = partitionSvgLayout.tr.x + (partitionSvgLayout.rectMargin / 2) 

		const aComps = [] // Actual DOM things

		partitionSvgLayout.rectWidth = ( partitionSvgLayout.w - 
			this.state.partitions.length * partitionSvgLayout.rectMargin ) /
			this.state.partitions.length

		let totalOffsets = 0 //TODO: Move this into the simulator, make a TOPIC object to aggregate it
		for (const a of this.state.partitions.values()) {
			totalOffsets = totalOffsets + a.maxOffset
			let aR = { 
				x: rectX,
				y: 600 - Math.min(a.maxOffset, partitionSvgLayout.h),
				width: partitionSvgLayout.rectWidth,
				height: Math.min(a.maxOffset, partitionSvgLayout.h) 
			}
			partitionRectangles.push(aR)

			aComps.push(<Partition a={a} aR={aR} key={"Partition-"+a.partitionId}  />)

			rectX += partitionSvgLayout.rectMargin + partitionSvgLayout.rectWidth
		}

		const pComps = []
		let totalBacklog = 0
		let producerSvgLayout = {
			w: 100,
			h: 400,
			tr: {
				x: 0, // Margin for label stuff should be zero?
				y: 20,  // 
			},
			bubbleSize: (400 / this.state.producers.length / 4) //margin is the same as bubble size
		}
		for (const p of this.state.producers.values()) {
			totalBacklog = totalBacklog + p.backlog
			pComps.push(<Producer p={p} svgLayout={producerSvgLayout} key={"Producer-"+p.producerId}/>)
		}

		const cComps = []
		let totalConsumed = 0
		let consumerSvgLayout = {
			w: 100,
			h: 400,
			tr: {
				x: 500, // (100 + 400)
				y: 200, // (600 / )
			},
			//bubbleMargin: bubbleSize,
			bubbleSize: (400 / this.state.consumers.length / 4) //margin is the same as bubble size
		}
		for (const c of this.state.consumers.values()) {
			totalConsumed = totalConsumed + c.totalOffsets
			cComps.push(<Consumer numConsumers={this.state.consumers.length} svgLayout={consumerSvgLayout} partitions={this.state.partitions} partitionRectangles={partitionRectangles} c={c} key={"Consumer-"+c.consumerId}/>)
		}

		return(
			<div class="k-sim">
				<div class="k-sim-control"> 
					{this.state.running ? 'run' : 'STOP'} 
					({this.state.tickNumber}/{this.state.maxTicks}) 
					{ this.state.running && 
						<button onClick = {() => this.stopSimulator()}>STOP</button>}
					{ this.state.initialized && 
						( this.state.running || 
						<button onClick = {() => this.resumeSimulator()}>resume</button>)}
					{ this.state.running ||
						<button onClick = {() => this.initializeSimulator()}>INIT</button>}
					{ this.props.settings.showSettings && 
						<SimulatorSettings settings={this.props.settings}/>}
				</div>
				<svg class="k-sim-svg" width={svgDim.width} height={svgDim.width}>
					<g class="layer-1-partitions"> 
						{aComps} 
					</g>
					<g class="layer-2-producers">
						<text x={producerSvgLayout.tr.x} y={producerSvgLayout.tr.y}
							dominantBaseline="middle" textAnchor="left"
							textLength={producerSvgLayout.w}> 
						Producer Backlog
						</text>
						{pComps}
					</g>
					<g class="layer-3-consumer"> 
						<text x={consumerSvgLayout.tr.x} y={consumerSvgLayout.tr.y}
							dominantBaseline="middle" textAnchor="left"
							textLength={consumerSvgLayout.w}> 
						Consumer Lag
						</text>
						{cComps} 
					</g>
				</svg>
			</div>
		);
	}
}

export default Simulator;
