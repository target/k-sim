import React from 'react';

class SimulatorController extends React.Component {
	constructor(props) {
		super();
	}



	render() {
		//console.log("settings", this.props.settings)
		// console.log("simulator controller current state", this.props.state)
		const producerPropList = Object.keys(this.props.state.settings.producer).map((k) =>
			<li><strong>{k}</strong>: {this.props.state.settings.producer[k]}</li>
		)
		const partitionPropList = Object.keys(this.props.state.settings.partition).map((k) =>
			<li><strong>{k}</strong>: {this.props.state.settings.partition[k]}</li>
		)
		const consumerPropList = Object.keys(this.props.state.settings.consumer).map((k) =>
			<li><strong>{k}</strong>: {this.props.state.settings.consumer[k]}</li>
		)
		return(
			<div class="k-sim-control"> 
					{ this.props.state.running && 
						<button class="playback" onClick = {() => this.props.simControl('stop')}>stop</button>}
					{ this.props.state.initialized && 
						( this.props.state.running || 
						<button class="playback" onClick = {() => this.props.simControl('play')}>play</button>)}
					{ this.props.state.running ||
						<button class="playback" onClick = {() => this.props.simControl('init')}>init</button>}
					<br/>(tick: {this.props.state.tickNumber}/{this.props.state.maxTicks}) 
				<div className="k-sim-settings">
					<h2>Producer {' '}
						<button onClick={() => this.props.simMutate([{actionType: 'create', simType: 'producer'}])}>+</button>
					</h2>
					<ul>{producerPropList}</ul>
					<h2>Partition {' '}
						<button onClick={() => this.props.simMutate([{actionType: 'create', simType: 'partition'}])}>+</button>
					</h2>
					<ul>{partitionPropList}</ul>
					<h2>Consumer {' '}
						<button onClick={() => this.props.simMutate([{actionType: 'create', simType: 'consumer'}])}>+</button>
					</h2>	
					<ul>{consumerPropList}</ul>
				</div>
			</div>

		);
	}
}

export default SimulatorController;
