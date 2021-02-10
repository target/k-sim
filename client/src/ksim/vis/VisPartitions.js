import React from 'react';

class VisGroupOffset extends React.Component{
	constructor(props) {
		super();
    }
    render() {
        //console.log('vGO', this.props)
        // TODO: Helper function
        const lag = this.props.parentOffset - this.props.myOffset
        const yOffset = this.props.parentHeight * (lag / this.props.parentOffset) // No, this is not pixel accurate.  Pixel accurate is hard

        let pos = {
            x: this.props.x,
            y: (this.props.parentY + yOffset)

        }
        
        const rectHeight = this.props.maxPartitionHeight / 50 // *shrug*
        let labelY = pos.y + rectHeight

        const rectWidth = this.props.partitionWidth * 11 / 10 // 10% overhang 
        let labelX = pos.x + (rectWidth / 20)
        pos.x += (this.props.partitionWidth - rectWidth) / 2 // overhang both sides

        return(<g className="group-offset-rect" 
            key={`${this.props.pId}-${this.props.gId}`}>
            <rect
                x={pos.x}
                y={pos.y}
                height={rectHeight}
                width={rectWidth}
                fill='purple'
                stroke='purple'
            />
            <text
                x={labelX}
                y={labelY}
                dominantBaseline="hanging"
            >
                {this.props.iId}-{this.props.myOffset}
            </text>
            </g>
        )
    }
}

class VisGroupOffsets extends React.Component{
	constructor(props) {
		super();
    }
    render() {
        //console.log('vGOs', this.props)
        let lineComps = []
        let pId = this.props.pId
        let tId = this.props.sim.partitions.byId[pId].topidId // <- Whoopsie typo upstream
        //console.log(tId)
        for (let g of Object.values(this.props.sim.groups.byId)) {
            if (g.topicMapping[tId]) { //} && (g.topicMapping[tId].length > 0) ) {
                if (pId in g.topicMapping[tId] ) { 
                    lineComps.push(<VisGroupOffset
                        sim={this.props.sim}
                        pId={pId}
                        gId={g.id}
                        iId={g.topicMapping[tId][pId].instanceId}
                        x={this.props.x}
                        parentY={this.props.parentY}
                        parentOffset={this.props.parentOffset}
                        parentHeight={this.props.parentHeight}
                        myOffset={g.topicMapping[tId][pId].offset}
                        partitionWidth={this.props.partitionWidth}
                        maxPartitionHeight={this.props.maxPartitionHeight}
                    />)
                }
            }

        }

        return(
            <g className={`${pId}-offsets`}>
              {lineComps}
            </g>
        )
    }
}
class VisPartition extends React.Component {
	constructor(props) {
		super();
    }
    render() {
        let pId = this.props.pId
        let rId = this.props.sim.partitions.byId[pId].replicas[0]
        
        const myOffset = this.props.sim.replicas.byId[rId].maxOffset //HACK: this isn't always true, but probably is
        const extraOffsets = myOffset - this.props.minOffset
        const heightBonus = extraOffsets * this.props.heightPerBonusOffset
        const height = heightBonus + this.props.minHeight
        const yOffset = this.props.maxHeight - height

        const pos = {
            x: this.props.x,
            y: (this.props.y + yOffset)
        }

        const labelY = pos.y //Align to the top of the rectangle
		return(
			<g className="g-partition" 
				key={`partition-${pId}`} 
				//onClick={() => this.props.handleSimClick({type: 'partition', id: aId})} 
			>
				<rect 
					x={pos.x}
					y={pos.y}
					width={this.props.width}
					height={height}
					fill='steelblue'
					stroke='black'
				/>
				<text 
					textAnchor="end" 
					transform={`translate(${pos.x + this.props.width *2/3 } , ${labelY - 2 }) rotate(65)`} > 
					{myOffset} ({pId})
				</text>
                <VisGroupOffsets
                    sim={this.props.sim}
                    pId={pId}
                    x={this.props.x}
                    parentY={pos.y}
                    parentOffset={myOffset}
                    parentHeight={height}
                    partitionWidth={this.props.width}
                    maxPartitionHeight={this.props.maxHeight}
                />
			</g>
		);
    }
}

class VisPartitions extends React.Component {
	constructor(props) {
		super();
    }

    getHighestMaxOffset(partitions, sim) {
        let maxOffset = 0 
        for (let pId of partitions) {
            for (let rId of sim.partitions.byId[pId].replicas) {
                if (sim.replicas.byId[rId].maxOffset > maxOffset) { 
                    maxOffset = sim.replicas.byId[rId].maxOffset
                }
            }
        }
        return(maxOffset)
    }

    getLowestMaxOffset(partitions, sim) {
        let minOffset = Infinity

        for (let pId of partitions) {
            let maxOffset = 0
            for (let rId of sim.partitions.byId[pId].replicas) {
                if (sim.replicas.byId[rId].maxOffset > maxOffset) { 
                    maxOffset = sim.replicas.byId[rId].maxOffset
                }
            }
            if (maxOffset < minOffset) {
                minOffset = maxOffset
            }
        }
        return(minOffset)
    }

	render() {
        if (this.props.ids === null ) { return null }
        const num = this.props.ids.length
        if (num === 0 ) { return null }
        const marginX = this.props.width / 30 // *shrug*
        const perWidth = (this.props.width - ( num * marginX ) ) /  ( num + 1 )

        const maxHeight = this.props.height * 4 / 5
        const minHeight = maxHeight * 3 / 10

        const maxOffset = this.getHighestMaxOffset(this.props.ids, this.props.sim)
        const minOffset = this.getLowestMaxOffset(this.props.ids, this.props.sim)

        // Lowest will always be min, highest will always be max, this factor is for the inbetweens
        const heightPerBonusOffset = (maxHeight - minHeight) / (maxOffset - minOffset)

        let xOffset = this.props.x
        let yOffset = this.props.y + (this.props.height - maxHeight)
        //let n = 0
        const finalComps = []
        for (let pId of this.props.ids) {
            finalComps.push(
                <VisPartition
                    x={xOffset}
                    y={yOffset}
                    width={perWidth}
                    maxHeight={maxHeight}
                    minHeight={minHeight}
                    heightPerBonusOffset={heightPerBonusOffset}
                    minOffset={minOffset}
                    pId={pId}
                    sim={this.props.sim}
                />)
            //n++
            xOffset += perWidth + marginX
        }

        return(<g className="k-sim-partitions">{finalComps}</g>)
    }

}

export default VisPartitions

