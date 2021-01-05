import React from 'react';

class SimulatorSettings extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}



	render() {
		//console.log("settings", this.props.settings)
		const layoutPropList = Object.keys(this.props.settings.layout).map((k) =>
			<li><strong>{k}</strong>: {this.props.settings.layout[k]}</li>
		)
		const producerPropList = Object.keys(this.props.settings.producer).map((k) =>
			<li><strong>{k}</strong>: {this.props.settings.producer[k]}</li>
		)
		const partitionPropList = Object.keys(this.props.settings.partition).map((k) =>
			<li><strong>{k}</strong>: {this.props.settings.partition[k]}</li>
		)
		const consumerPropList = Object.keys(this.props.settings.consumer).map((k) =>
			<li><strong>{k}</strong>: {this.props.settings.consumer[k]}</li>
		)
		return(
			<div className="simulator-settings">
				<h1>Custom Settings</h1>
				<h2>Layout</h2>
				<ul>{layoutPropList}</ul>
				<h2>Producer</h2>
				<ul>{producerPropList}</ul>
				<h2>Partition</h2>
				<ul>{partitionPropList}</ul>
				<h2>Consumer</h2>
				<ul>{consumerPropList}</ul>
			</div>
		);
	}
}

export default SimulatorSettings;
