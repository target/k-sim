import React from 'react';

class ProducerBacklogBubble extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		//TODO:  **CSS STYLING!**
		const badColor = 'red'
		const defaultColor = 'lightgray'

		const fillColor = ( (this.props.backlog > (this.props.produceRate * 2)) ? badColor : defaultColor )

		const bubbleFactor = this.props.bubbleSize / 3.3 //At 1,000 records, we will be close to max bubble size and gently grow to bubble size at 2k
		const r = Math.max(5, Math.log(this.props.backlog) * bubbleFactor)

		//TODO: Make a shortener that does 12.1k vs 12100  (will matter more if we end up on big sizes)
		const label = ( this.props.backlog > 12 ? `p${this.props.producerId}:${this.props.backlog}` : '-' )

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
				{label}	
			</text>
			</React.Fragment>
		)

		//<div>---p({this.props.partitionId}) lag: {this.props.lag} current: {this.props.currentOffset}  </div>
	}
}
class Producer extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		let pId = this.props.p.producerId

		/*  TODO:  We need to update our simulation to showcase what is producing where
		// Calculate per-partition produce data for fancyness
		let totalProduce = 0
		for (let myPartition of this.props.p.dstPartitions) {
		}
		*/

		//backlog Component
		let bubbleOffset = this.props.svgLayout.bubbleSize * (pId + .5) * 4
		const bComp = <ProducerBacklogBubble
			xPos={this.props.svgLayout.tr.x + this.props.svgLayout.w / 2}
			yPos={this.props.svgLayout.tr.y + bubbleOffset}
			bubbleSize={this.props.svgLayout.bubbleSize} //Its a lie, but it's close enough
			producerId={pId}
			backlog={this.props.p.backlog}
			
		/>

		return(
			<g class="g-producer" 
				id={`producer-${pId}`} 
				onClick={() => this.props.handleSimClick({type: 'producer', id: pId})} 
			>
				{bComp}
			</g>
		);
	}
}

export default Producer;
