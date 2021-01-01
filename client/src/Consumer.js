import React from 'react';

class Consumer extends React.Component {
	constructor() {
		super();
		this.state = {
			client_offset: 0, 
			consume_rate: 0,
		};
	}

	render() {
		return(
			<div>Consumer (client_offset: {this.state.client_offset}) </div>
		);
	}
}

export default Consumer;
