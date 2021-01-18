import React from 'react';

// import './SimulatorContext.css'

class SimulatorContext extends React.Component {
	constructor(props) {
		super();
		// this.state = { }
	}



	render() {
		return(
            <div class="k-sim-info">
            { this.props.state.selectedObj &&
            <h1>{this.props.state.selectedObj.type} {' '}
                {this.props.state.selectedObj.id}
            </h1>
            }
            </div>
		);
	}
}

export default SimulatorContext;