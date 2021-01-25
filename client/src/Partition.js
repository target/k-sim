import React from 'react';

class Partition extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		let aId = this.props.a.partitionId
		const labelY = 0 /*- this.props.aR.y */ + this.props.aR.y //Align to the bottom of the rectangle.
		//
		// const labelLength = this.props.aR.width * 7 / 8 //Math.max(this.props.aR.height / 2, 50)
		// textLength={labelLength}
		return(
			<g class="g-partition" 
				id={`partition-${aId}`} 
				onClick={() => this.props.handleSimClick({type: 'partition', id: aId})} 
			>
				<rect 
					x={this.props.aR.x}
					y={this.props.aR.y}
					width={this.props.aR.width}
					height={this.props.aR.height}
					fill='steelblue'
					stroke='black'
				/>
				<text 
					textAnchor="end" 
					transform={`translate(${this.props.aR.x + this.props.aR.width *2 /3 } , ${labelY - 2 }) rotate(65)`} > 
					{this.props.a.maxOffset}  (p{aId})
				</text>
			</g>
		);
	}
}

export default Partition;
