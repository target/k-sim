import React from 'react';

import { cloneDeep } from "lodash" // Because I am a horrible monster who can't be bothered to write my own

import Producer from './Producer.js';
import Partition from './Partition.js';
import Consumer from './Consumer.js';
import SimulatorController from './SimulatorController.js';
import SimulatorContext from './SimulatorContext.js'

import './Simulator.css'

class Simulator extends React.Component {
	constructor(props) {
		super();
		this.state = {
			settings: props.settings,
			producers: [],
			partitions: [],
			consumers: [],
			consumerGroup: {}
		}
		this.initializeSimulator()
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

	// shuffledIndexes: Produces an array of integers from 0 to n-1 that is randomly ordered.
	shuffledIndexes(n){
		let indexes = []
		for (let i = 0 ; i < n ; i++ ) { indexes.push(i) }

		// Thanks SO! https://stackoverflow.com/a/12646864/14584782
		for (let i = indexes.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			[indexes[i], indexes[j]] = [indexes[j], indexes[i]];
		}
		return indexes
	}

	tick() {
		// It's wasteful, but we can optimize for speed by using a real language later.
		var newProducers = cloneDeep(this.state.producers)
		var newPartitions = cloneDeep(this.state.partitions)
		var newConsumers = cloneDeep(this.state.consumers)
		var newConsumerGroup = cloneDeep(this.state.consumerGroup)

		// Initialize the rate data
		for (let a of newPartitions) {
			a.receivedThisTick = 0
			a.transmittedThisTick = 0
		}

		// Step 1: Create and Produce!
		for (let pIdx of this.shuffledIndexes(newProducers.length)) {
			let p = newProducers[pIdx]
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
		for (let cId of this.shuffledIndexes(newConsumerGroup.partitionMapping.length) ) {
			let c=newConsumers[cId]
			let consumeCap = c.consumeRate
			let totalOffsets = 0
			for (let mIdx of this.shuffledIndexes(newConsumerGroup.partitionMapping[cId].length)) { //TODO:  What to do if there wasn't enough drain capacity? shuffle?
				let aId = newConsumerGroup.partitionMapping[cId][mIdx]
				let o = newConsumerGroup.offsets[aId]

				let avail = (newPartitions[aId].maxOffset - o.currentOffset)
				//console.log(`consume(${cId}) a(${aId}) avail: ${avail} o:`, o)
				if (avail < 0) { 
					// Shouldn't be here!
					//console.log("ERROR: Consumer {c} on {p} is in an impossible place?")
				} else {
					if (consumeCap <= 0) {
						//console.log("Consumer {c} does not have *any* capacity to service {avail} waiting records on {a}")
					} else {
						//// Attempt to get the maxiumum available transfer or all the available records
						let n = Math.min( consumeCap, this.partitionAvailTransmit(newPartitions[aId], avail) )
						o.currentOffset = o.currentOffset + n
						newPartitions[aId].transmitThisTick = newPartitions[aId] - n
						consumeCap = consumeCap - n

					}
				}
				totalOffsets = totalOffsets + o.currentOffset // BUG: Not exactly true, but whatever, we don't rebalance
			}
			c.totalOffsets = totalOffsets
		}

		this.setState({
			...this.state,
			tickNumber: this.state.tickNumber + 1,
			producers: newProducers,
			partitions: newPartitions,
			consumers: newConsumers,
			consumerGroup: newConsumerGroup
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

	makeProducer(pId){
		const newProducer = {
			producerId: pId,
			backlog: 0,
			createRate: 1, 
			produceRate: 1,
			lastDestPartition: 0,
			produceStrategy: "tick-next-with-overflow" //advances the partition every tick, and also on cases of overflow
		}
		return({...newProducer, ...this.state.settings.producer})
	}

	makePartition(aId){
		const newPartition = {
			partitionId: aId,
			maxOffset: 0,
			receivedThisTick: 0,
			maxReceiveRate: 1,  
			transmittedThisTick: 0,
			maxTransmitRate: 1  
		}
		return({ ...newPartition, ...this.state.settings.partition })
	}

	makeConsumer(cId){
		const newConsumer = {
			consumerId: cId,
			consumeRate: 1,
			totalOffsets: 0
		}
		return({...newConsumer, ...this.state.settings.consumer})
	}

	makeConsumerGroup(partitions, consumers) {
		/* TOPIC: storing derived vs required
		   consumerLag is derived from consumerOffset and maxOffset of a partition
		   should we store it in the structure here?
		   for now, we have the tooling to calculate so let's not refactor
		   */
		let consumerGroup = {
			partitionMapping: this.getPartitionBalance(this.state.settings.strategy, partitions.length, consumers.length),
			offsets: [],
		}

		for(let a of partitions){
			// TODO:  Add option to initialize to a.maxOffset, it's a real kafka setting after all!
			consumerGroup.offsets.push({partitionId: a.partitionId, currentOffset: 0})
		}
		return(consumerGroup)
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

	deleteIndexesFromArray(sortedIndexes, arr) {
		//returns a new copy of the array with the indexes removed
		//if invalid indexes are supplied, elements may not be deleted
		let newArr = []

		let delPtr = 0
		let pushedIndex = 0
		for (let oldPtr = 0; oldPtr < arr.length ; oldPtr++ ) {
			if (!(sortedIndexes[delPtr] === oldPtr)) {
				arr[oldPtr].partitionId = pushedIndex
				newArr.push(arr[oldPtr])
				pushedIndex++
			} else {
				delPtr++
			}
		}
		return newArr
	}

	deletePartitionsFromConsumerGroup(partitionsDeleted, newPartitions, consumerGroup) {
		let indexesToDelete = [...partitionsDeleted].sort((a,b)=>a-b)

		let newOffsets = []

		let delPtr = 0
		for (let oldPtr = 0; oldPtr < consumerGroup.offsets.length ; oldPtr++ ) {
			if (!(indexesToDelete[delPtr] === oldPtr)) {
				let o = consumerGroup.offsets[oldPtr]
				o.partitionId -= delPtr // Need to shift the partition IDs downward for each thing deleted so far.
				newOffsets.push(o)
			} else {
				delPtr++
			}
		}

		let newConsumerGroup = {
			...this.consumerGroupRebalance(
				this.state.settings.partitionBalanceStrategy, 
				newPartitions,
				this.state.consumers,
				consumerGroup),
			offsets: newOffsets
		}

		return newConsumerGroup
	}

	//NOTE: This handler will mutate both partitions and consumerGroup in the state
	deletePartitions(partitionsDeleted, unselect){
		let indexesToDelete = [...partitionsDeleted].sort((a,b)=>a-b)
		let newPartitions=this.deleteIndexesFromArray(indexesToDelete, this.state.partitions)

		//TODO: This is an interesting thing, should we instantly rebalance for the consumerGroup?
		if (unselect) {
			this.setState({
				...this.state,
				partitions: newPartitions,
				consumerGroup: this.deletePartitionsFromConsumerGroup(partitionsDeleted, newPartitions, this.state.consumerGroup),
				selectedObj: null
			})
		} else {
			this.setState({
				...this.state,
				partitions: newPartitions,
				consumerGroup: this.deletePartitionsFromConsumerGroup(partitionsDeleted, newPartitions, this.state.consumerGroup)
			})
		}
	}

	//NOTE: This handler will mutate both partitions and consumerGroup in the state
	createPartitions(n){
		let newPartitions = cloneDeep(this.state.partitions)
		let newOffsets = cloneDeep(this.state.consumerGroup.offsets)
		// console.log("before making partitions...", this.state)

		let finalLength = this.state.partitions.length + n
		for (let aId = this.state.partitions.length; aId < finalLength; aId++) {
			newPartitions.push(this.makePartition(aId))
			newOffsets.push({partitionId: aId, currentOffset: 0}) //TODO: Consider leaving this for rebalance?
		}

		//TODO: This is an interesting thing, should we instantly rebalance the consumerGroup?
		let newConsumerGroup = this.consumerGroupRebalance(
				this.state.settings.partitionBalanceStrategy, 
				newPartitions,
				this.state.consumers,
				this.state.consumerGroup
			)
		newConsumerGroup.offsets = newOffsets

		// console.log("created partitions...", newPartitions, newConsumerGroup)
		this.setState({
			...this.state,
			partitions: newPartitions, 
			consumerGroup: newConsumerGroup
		})
	}

	//NOTE: This handler will mutate both consumers consumeGroup in the state
	deleteConsumers(consumersDeleted, unselect){
		let indexesToDelete = [...consumersDeleted].sort((a,b)=>a-b)
		let newConsumers=this.deleteIndexesFromArray(indexesToDelete, this.state.consumers)

		//TODO: This is an interesting thing, should we instantly rebalance the consumerGroup?
		let newConsumerGroup = this.consumerGroupRebalance(
				this.state.settings.partitionBalanceStrategy,
				this.state.partitions, 
				newConsumers, 
				this.state.consumerGroup)

		if (unselect) {
			this.setState({
				...this.state,
				consumers: newConsumers,
				consumerGroup: newConsumerGroup,
				selectedObj: null
			})
		} else {
			this.setState({
				...this.state,
				consumers: newConsumers,
				consumerGroup: newConsumerGroup
			})
		}
	}

	//NOTE: This handler will mutate both consumers and consumerGroup in the state
	createConsumers(n){
		let newConsumers = cloneDeep(this.state.consumers)

		let finalLength = this.state.consumers.length + n
		for (let cId = this.state.consumers.length; cId < finalLength; cId++) {
			newConsumers.push(this.makeConsumer(cId))
		}

		let newConsumerGroup = this.consumerGroupRebalance(
				'round-robin', 
				this.state.partitions,
				newConsumers,
				this.state.consumerGroup)

		this.setState({
			...this.state,
			consumers: newConsumers,
			consumerGroup: newConsumerGroup
		})
	}

	consumerGroupRebalance(strategy, partitions, consumers, consumerGroup){
		// 1: Get the desired mapping state
		const newConsumerGroup = {
			...consumerGroup,
			partitionMapping: this.getPartitionBalance(strategy, partitions.length, consumers.length)
		}

		return newConsumerGroup
	}

	initializeSimulator() {
		let numProducers = this.state.settings.layout.numProducers
		let numPartitions = this.state.settings.layout.numPartitions
		let numConsumers = this.state.settings.layout.numConsumers

		const finalProducers = []
		for (let pId = 0; pId < numProducers ; pId++  ) {
			finalProducers.push(this.makeProducer(pId))
		}

		const finalPartitions = []
		for (let aId = 0; aId < numPartitions ; aId++  ) {
			finalPartitions.push(this.makePartition(aId))
		}

		const finalConsumers = []

		for (let cId = 0; cId < numConsumers ; cId++  ) { finalConsumers.push(this.makeConsumer(cId)) }
		const finalConsumerGroup = this.consumerGroupRebalance(this.state.settings.partitionBalanceStrategy, finalPartitions, finalConsumers, this.makeConsumerGroup(finalPartitions, finalConsumers))

		const generalDefaults = {
			tickNumber: 1,
			maxTicks: 100,
			tickMs: 150
		}

		const finalState = {
			running: false,
			tickIntervalId: null,
			initialized: true,
			producers: finalProducers,
			partitions: finalPartitions,
			consumers: finalConsumers,
			consumerGroup: finalConsumerGroup
		}

		console.log("Initialized simulator with this state:")
		console.log(finalState)
		this.setState({
			...this.state,
			...finalState,
			...generalDefaults,
			...this.state.settings.general
		});
		//TODO

	}

	simControl(command){
		// TODO: Check that we should issue these commands
		switch (command) {
			case 'init':
				this.initializeSimulator()
				break;
			case 'stop':
				this.stopSimulator()
				break;
			case 'play':
			  this.resumeSimulator()
				break;
			default:
			  console.log(`Invalid Sim Control Received ${command}.`);
		}
	}

	simMutate(payload){
		console.log('simMutate Incoming payload:', payload)
		for(let action of payload.values()) {
			switch(action['actionType']){
				case 'create':
					switch(action['simType']){
						case 'producer':
							let pId = this.state.producers.length
							let newProducerData = {
								producers: this.state.producers.concat([this.makeProducer(pId)])
							} 
							this.setState({
								...this.state,
								...newProducerData
							})
							break;
						case 'partition':
							this.createPartitions(1)
							break;
						case 'consumer':
							this.createConsumers(1)
							break;
						default:
							console.log('Invalid Sim Mutate Type')			
					}
					break;
				//case 'read':  //Getter methods can just ask for state or receive it as a property for now
				//	break;
				case 'update':
					break;
				case 'delete':
					switch(action['simType']){
						case 'producer':
							let delIdx = this.state.producers.length - 1 //Maximum valid producer, and the default
							if ( action['id'] < delIdx && 
								action['id'] >= 0 ) {
									delIdx = action['id'] //BUG: Not forcing to int
								}
							let newProducers = []
							let newIdx = 0
							for (let pIdx = 0; pIdx < this.state.producers.length; pIdx++) {
								if (pIdx === delIdx) {
									//pass
								} else {
									newProducers.push({
										...this.state.producers[pIdx],
										producerId: newIdx
									})
									newIdx++
								}
							}
							//console.log("done removing", this.state.producers, newProducers)
							//HACK:  This needs a much better way to handle unselect
							if (action['unselect']) {
								this.setState({
									...this.state,
									producers: newProducers,
									selectedObj: null
								})
							} else {
								this.setState({
									...this.state,
									producers: newProducers
								})
							}
							break;
						case 'partition':
							let aDelIdx = this.state.partitions.length - 1 //Maximum valid producer, and the default
							if ( action['id'] < aDelIdx && 
								action['id'] >= 0 ) {
									aDelIdx = action['id'] //BUG: Not forcing to int
								}
							this.deletePartitions([aDelIdx], action['unselect'])
							break;
						case 'consumer':
							let cDelIdx = this.state.consumers.length - 1 //Maximum valid producer, and the default
							if ( action['id'] < cDelIdx && 
								action['id'] >= 0 ) {
									cDelIdx = action['id'] //BUG: Not forcing to int
								}
							this.deleteConsumers([cDelIdx], action['unselect'])
							break;
						default:
							console.log('Invalid Sim Mutate Type')			
					}	
					break;
				case 'chaos': //Handy dandy tester of your architecture and our code!  Dispatches random supported actions of each type.
					for (let chaosRun = 0; chaosRun < action['count']; chaosRun++) {

						switch(Math.floor(Math.random() * 6)){
							case 0:
								this.simMutate([{actionType: 'create', simType: 'producer'}])
								break;
							case 1:
								this.simMutate([{actionType: 'create', simType: 'partition'}])
								break;
							case 2:
								this.simMutate([{actionType: 'create', simType: 'consumer'}])
								break;
							case 3:
								this.simMutate([{actionType: 'delete', simType: 'producer', id: Math.floor(Math.random() * this.state.producers.length), unselect: true}])
								break;
							case 4:
								this.simMutate([{actionType: 'delete', simType: 'partition', id: Math.floor(Math.random() * this.state.partitions.length), unselect: true}])
								break;
							case 5:
								this.simMutate([{actionType: 'delete', simType: 'consumer', id: Math.floor(Math.random() * this.state.consumers.length), unselect: true}])
								break;
						}
					}
					break;
				case 'unselect':
					this.setState({
						...this.state,
						selectedObj: null
					})
					break;
				default:
					console.log('Invalid Sim Mutate Action Type')			
			}
		}
	}

	handleSimClick(obj){
		console.log('handleSimClick', obj)
		this.setState({ 
			selectedObj: obj
			})
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

			aComps.push(<Partition a={a} aR={aR} handleSimClick={(p)=>{this.handleSimClick(p)}} key={"Partition-"+a.partitionId}  />)

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
			pComps.push(<Producer p={p} svgLayout={producerSvgLayout} handleSimClick={(p)=>{this.handleSimClick(p)}} key={"Producer-"+p.producerId}/>)
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
		for (const c of this.state.consumers) {
			totalConsumed = totalConsumed + c.totalOffsets
			cComps.push(<Consumer numConsumers={this.state.consumers.length} svgLayout={consumerSvgLayout} partitions={this.state.partitions} partitionRectangles={partitionRectangles} c={c} g={this.state.consumerGroup} handleSimClick={(p)=>{this.handleSimClick(p)}} key={"Consumer-"+c.consumerId}/>)
		}

		return(
			<div class="k-sim">
				<SimulatorController simControl={(v)=>{this.simControl(v)}} simMutate={(p)=>{this.simMutate(p)}} state={this.state}/>
				
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
				<SimulatorContext 
					simMutate={(p)=>{this.simMutate(p)}} 
					state={this.state} 
					/>
			</div>
		);
	}
}

export default Simulator;
