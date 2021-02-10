import React, { Component } from 'react';
class KSimCtx extends Component {
	constructor(props) {
        super(props)
        // Here we set up a completely empty state
	    this.state = { 
        }
	}
    componentDidMount() {}

    componentWillUnmount() {}

    render() {
  	return (
    <div className="k-sim-ctx">
      Contextual Browser (WIP)
	</div>
    );
  }
}

export default KSimCtx;