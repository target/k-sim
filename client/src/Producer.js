import React from 'react';

class Producer extends React.Component {
	constructor() {
		super();
		this.state = {
			backlog: 0,
			create_rate: 0,
			produce_rate: 0
		};
	}

	render() {
		return(
			<div>Producer (backlog: {this.state.backlog}) </div>
		);
	}
}

export default Producer;
