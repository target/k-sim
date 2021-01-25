import React from 'react';

// import './SimulatorContext.css'

class SimulatorContext extends React.Component {
	constructor(props) {
		super();
		// this.state = { }
	}



	render() {
		let simType = null
		let id = null
		let comps = []

		if (this.props.state.selectedObj) {
			simType = this.props.state.selectedObj.type
			id = this.props.state.selectedObj.id
			let lookupKey = `${simType}s`
			console.log(lookupKey, id)
			console.log(this.props.state)
			console.log(this.props.state[lookupKey][id])
			for (let [k, v] of Object.entries(this.props.state[lookupKey][id]) ){
				comps.push(
					<React.Fragment> 
						<b>{k}</b>: {v} <br/>
					</React.Fragment>
				)
			}
		}
		return(
            <div class="k-sim-info">
			{ this.props.state.selectedObj &&
			<React.Fragment>
				<h1>{simType} {' '} {id}
				</h1>
				{comps}
				<button onClick={() => this.props.simMutate([
					{ actionType: 'unselect' },
					{ actionType: 'delete', 
						simType: simType,
						id: id
					}
				]
				)}>U, D</button>
				<button onClick={() => this.props.simMutate([
					{ actionType: 'delete', 
						simType: simType,
						id: id,
						unselect: true
					}
				]
				)}>Delete w/unselect</button>
			</React.Fragment>
            }
            </div>
		);
	}
}

export default SimulatorContext;