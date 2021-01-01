import React from 'react';

class Partition extends React.Component {
	constructor() {
		super();
		this.state = {
			max_offset: 0,
			client_offset: 0,
			incoming_rate: 0,
			outgoing_rate: 0
		};
	}

	render() {
		return(
			<div>Partition (max_offset: {this.state.max_offset}, client_offset: {this.state.client_offset}) </div>
		);
	}
}

export default Partition;
