import React from 'react';

class Producer extends React.Component {
	constructor(props) { 
		super();
		this.state = {
			backlog: 0,
			create_rate: 1,
			produce_rate: 0
		};

    //this.handleClick = this.handleClick.bind(this)
	}


	render() {
		return(
			<div>Producer (backlog: {this.props.backlog}) </div>
		);
	}
}

export default Producer;
