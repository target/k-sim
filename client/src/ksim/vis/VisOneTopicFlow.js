import React from 'react';
import VisInstances from './VisInstances.js'
import VisPartitions from './VisPartitions.js'
import VisBrokers from './VisBrokers.js'

import { whatDrainsToTopic, whatSourcesFromTopic, whatPartitionsInThisTopic, whatHostsThesePartitions } from '../utils/utils.js'

class VisOneTopicFlow extends React.Component {
	constructor(props) {
		super();
    }

	render() {
        const instancesProducing = whatDrainsToTopic(this.props.topicId, this.props.sim)
        const partitions = whatPartitionsInThisTopic(this.props.topicId, this.props.sim)
        const brokers = whatHostsThesePartitions(partitions, this.props.sim)
        const instancesConsuming = whatSourcesFromTopic(this.props.topicId, this.props.sim)

        const instanceWidth = this.props.width / 5
        const partitionsWidth = this.props.width - (2 * instanceWidth)

        const instanceHeight = this.props.height * (4 / 5)
        const partitionsHeight = instanceHeight

        const brokersWidth = partitionsWidth
        const brokersHeight = this.props.height - partitionsHeight

        return(
            <g className="k-sim-topic-flow">
                <VisInstances ids={instancesProducing} sim={this.props.sim}
                    x={this.props.x}
                    y={this.props.y}
                    width={instanceWidth}
                    height={instanceHeight}
                    />
                <VisPartitions ids={partitions} sim={this.props.sim}
                    x={this.props.x + instanceWidth}
                    y={this.props.y}
                    width={partitionsWidth}
                    height={partitionsHeight}
                    />
                <VisBrokers ids={brokers} sim={this.props.sim}
                    x={this.props.x}
                    y={this.props.y + instanceHeight}
                    width={brokersWidth}
                    height={brokersHeight}
                />
                <VisInstances ids={instancesConsuming} sim={this.props.sim}
                    x={this.props.x + instanceWidth + partitionsWidth}
                    y={this.props.y}
                    width={instanceWidth}
                    height={instanceHeight}
                    />
            </g>
        )
    }
}

export default VisOneTopicFlow