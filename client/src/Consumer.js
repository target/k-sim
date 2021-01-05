import React from 'react';

class ConsumerPartition extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		return(
		<div>---p({this.props.partitionId}) lag: {this.props.lag} current: {this.props.currentOffset}  </div>
		)

	}
}


class Consumer extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		const aComps = []
		let totalLag = 0
		let totalOffsets = 0
		for (let myPartition of this.props.c.srcPartitions) {
			let a = this.props.partitions[myPartition.partitionId]
			let lag = a.maxOffset - myPartition.currentOffset
			totalLag += lag
			totalOffsets += myPartition.currentOffset
			aComps.push(<ConsumerPartition 
				partitionId={myPartition.partitionId} 
				currentOffset={myPartition.currentOffset}
				lag={lag} />) }
		return(
			<div className="consumer">
				Consumer (lag: {totalLag},  consumed: {totalOffsets}) 
				{aComps}
			</div>
		);
	}
}

export default Consumer;
