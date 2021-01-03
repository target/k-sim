import React from 'react';

class Consumer extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		return(
			<div>Consumer (currentOffset: {this.props.currentOffset}) </div>
		);
	}
}

export default Consumer;
