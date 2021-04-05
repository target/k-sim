import React from 'react';

class VisBacklog extends React.Component{
  constructor(props) {
		super();
    }

	render() {
    const lagColor = 'red'
    const defaultColor = 'lightgray'
    const minBubbleSize = 10

    const backlog=this.props.b.backlog
    const maxBacklog=this.props.b.maxBacklog

    const fillColor = ( (backlog > maxBacklog / 2 ) ? lagColor : defaultColor )

    //At 100 records, we will be close to max bubble size and gently grow to bubble size at 2k
    const bubbleFactor = (Math.max(this.props.maxBubbleSize, minBubbleSize) / 6.6)
		const r = Math.max(5, Math.log(backlog) * bubbleFactor)

		const bubbleLabel = ( backlog > minBubbleSize ? `b:${backlog}` : '-' )

    return (
        <>
            <circle
                cx={this.props.x}
                cy={this.props.y}
                fill={fillColor}
                stroke="black"
                r={r}
                />
            <text
                x={this.props.x}
                y={this.props.y}
                dominantBaseline="middle"
                textAnchor="middle">
                {bubbleLabel}
            </text>
	     </>
    )
  }
}

class VisCapacity extends React.Component {
  constructor(props) {
		super();
  }

    // Working here:  Pass the capacity and make a rectangle that colors blue when bored, red when near empty
	render() {
    if (this.props.perfData === null) { return (null)}
    //console.log("cap", this.props)
    const total = this.props.perfData.capacity
    const used = total - this.props.perfData.tickCapacity // tickCapacity is how much was remaining at the end of the tick
    const usedRatio = Math.min(1.0, used / total) // If we whoopsie, cap to 100%

    const usedHeight = usedRatio * this.props.height
    const yOffset = this.props.height - usedHeight
    const capacityLabel = `${Math.floor((used / total) * 100)}%`
    return(
        <>
            <rect
                x={this.props.x}
                y={this.props.y}
                width={this.props.width}
                height={this.props.height}
                fill="rgb(50,50,50)"
                stroke="rgb(0,0,0)"
            />
            <rect
                x={this.props.x}
                y={this.props.y + yOffset}
                width={this.props.width}
                height={usedHeight}
                fill="rgb(100,100,180)"
                stroke="rgb(0,0,0)"
            />
            <text
                transform={`translate(${this.props.x + this.props.width } , ${this.props.y + this.props.height })` }
                // rotate(90)
                textAnchor="start"
                dominantBaseline="middle"
                //textLength={Math.max(usedHeight, 5)}
            >
                {capacityLabel}
            </text>
        </>
    )
  }
}



class VisInstance extends React.Component {
	constructor(props) {
		super();
  }

	render() {
    //console.log(this.props.sim)
    const backlogObject=this.props.sim.instances.byId[this.props.iId].backlog
    const perfData=this.props.sim.instances.byId[this.props.iId].perfData

    return(<g className="k-sim-instance">
        <rect
            x={this.props.x}
            y={this.props.y}
            width={this.props.width}
            height={this.props.height}
            fill="rgb(220,220,220)"
        />
        <VisBacklog
            x={this.props.x + this.props.width*2/3}
            y={this.props.y + this.props.height*1/3}
            b={backlogObject}
            maxBubbleSize={Math.min(this.props.width, this.props.height) / 3}
        />
        <VisCapacity
            x={this.props.x + this.props.width / 18 }
            y={this.props.y + this.props.height / 20}
            perfData={perfData}
            height={this.props.height * 9 / 10}
            width={this.props.width / 5}
        />
        <text
            // textLength={this.props.width / 2}
            x={this.props.x + this.props.width * 6 / 16}
            y={this.props.y}
            dominantBaseline="hanging">
            {this.props.iId}
        </text>
    </g>)
  }
}
class VisInstances extends React.Component {
	constructor(props) {
		super();
  }

	render() {
    const num = this.props.ids.length
    if (num < 1) { return (null)}

    const marginY = this.props.height / 20 // *shrug*
    const wiggleX = this.props.width / 10  // *shrug*


    const perHeight = (this.props.height - ( num * marginY ) ) /  ( num + 1 )
    const perWidth = (this.props.width - 2 * wiggleX)

    const finalComps = []
    let xOffset = this.props.x + wiggleX
    let yOffset = this.props.y
    let n = 0
    for (let id of this.props.ids) {
        finalComps.push(
            <VisInstance
                iId={id}
                sim={this.props.sim}
                x={xOffset}
                y={yOffset}
                width={perWidth}
                height={perHeight}
            />
        )
        n++
        if ( n % 2 ) {
            xOffset += wiggleX
        } else {
            xOffset -= wiggleX
        }
        yOffset += marginY + perHeight
    }
    return(
        <g className="k-sim-instances">{finalComps}</g>
    )
  }
}

export default VisInstances
