import React from 'react';

class Partition extends React.Component {
	constructor(props) {
		super();
		this.state = { };
	}

	render() {
		return(
			<div>Partition (maxOffset: {this.props.maxOffset})
      </div>
		);
	}
}

export default Partition;
