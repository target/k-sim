import React from 'react';

class ConsumerLagBubble extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		//TODO:  **CSS STYLING!**
		const lagColor = 'red'
		const defaultColor = 'lightgray'

		const fillColor = ( (this.props.lag > (this.props.consumeRate * 2)) ? lagColor : defaultColor )

		const bubbleFactor = this.props.bubbleSize / 3.3 //At 1,000 records, we will be close to max bubble size and gently grow to bubble size at 2k
		const r = Math.max(5, Math.log(this.props.lag) * bubbleFactor)

		//TODO: Make a shortener that does 12.1k vs 12100  (will matter more if we end up on big sizes)
		const lagLabel = ( this.props.lag > 12 ? `c${this.props.consumerId}:${this.props.lag}` : '-' )

		return(
			<React.Fragment>
			<circle 
				cx={this.props.xPos} 
				cy={this.props.yPos} 
				fill={fillColor}
				stroke="black"
				r={r}
				/>
			<text 
				x={this.props.xPos} 
				y={this.props.yPos}
				dominantBaseline="middle"
				textAnchor="middle">
				{lagLabel}	
			</text>
			</React.Fragment>
		)

		//<div>---p({this.props.partitionId}) lag: {this.props.lag} current: {this.props.currentOffset}  </div>
	}
}
class Consumer extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		const aComps = []
		let cId = this.props.c.consumerId
		// Mathy bits for the actual stuff
		let totalLag = 0
		//let totalOffsets = 0

		let partitionList = this.props.g.partitionMapping[cId] //The list of partition IDs we are mapped to
		for (let aId of partitionList) {
			let a = this.props.partitions[aId]
			let aR = this.props.partitionRectangles[aId]
			let o = this.props.g.offsets[aId]

			let lag = a.maxOffset - o.currentOffset
			totalLag += lag
			//totalOffsets += myPartition.currentOffset

			
			let yPos = aR.y + lag
			aComps.push(
				<React.Fragment>
					<line
						x1={aR.x - 5}
						x2={aR.x + aR.width + 5}
						y1={yPos}
						y2={yPos}
						stroke='purple'
						strokeWidth="6" //TODO: Vary this based on the amount of records consumed perhaps?
						/>
				</React.Fragment>
			)
		}

		//lag Component
		let bubbleOffset = this.props.svgLayout.bubbleSize * (cId + .5) * 4
		const lComp = <ConsumerLagBubble
			xPos={this.props.svgLayout.tr.x + this.props.svgLayout.w / 2}
			yPos={this.props.svgLayout.tr.y + bubbleOffset}
			bubbleSize={this.props.svgLayout.bubbleSize} //Its a lie, but it's close enough
			consumerId={cId}
			lag={totalLag}
		/>

		return(
			<g class="g-consumer" 
				id={`consumer-${cId}`}
				onClick={() => this.props.handleSimClick({type: 'consumer', id: cId})}
			>
				{aComps}
				{lComp}
			</g>
		);
	}
}

export default Consumer;
