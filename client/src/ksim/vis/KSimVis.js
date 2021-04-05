import React, { Component } from 'react';
import VisOneTopicFlow from './VisOneTopicFlow.js'
class KSimVis extends Component {
	constructor(props) {
    super(props)
    // Here we set up a completely empty state
	  this.state = { }
	}
	
  render() {
    if (this.props.sim.topics.ids.length < 1) { return (<div className="k-sim-vis"> No topics to visualize. </div>) }

    const svgDim = {
      width: (this.props.svgWidth ? this.props.svgWidth : 600),
      height: (this.props.svgHeight ? this.props.svgHeight : 600),
    }


    // FIXME? Hm, probably best to put them all in one svg?
    const svgComps = []
    for (const topicId of this.props.sim.topics.ids) {
      svgComps.push(
        <svg className="k-sim-svg" width={svgDim.width} height={svgDim.height}>
          <VisOneTopicFlow
            topicId={topicId}
            sim={this.props.sim}
            width={svgDim.width}
            height={svgDim.height}
            x={0}
            y={0}
          />
        </svg>
      )
    }
  	return (
      <div className="k-sim-vis">
        {svgComps}
	    </div>
    );
  }
}

export default KSimVis;
