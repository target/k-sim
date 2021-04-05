import React, { Component } from 'react';
import AsyncLock from 'async-lock';
//import KSimCtl from './ctl/KSimCtl.js'
import KSimVis from './vis/KSimVis.js'
//import KSimCtx from './KSimCtx.js'
import './KSim.css'
import { newSim, tick } from './engine/KSimEngine.js'
//import { instAddSimpleFlow } from './data/instAddSimpleFlow.js'
import { instTwoTopics } from './data/instTwoTopics.js'


class KSim extends Component {
  constructor(props) {
    super(props)
    // Here we set up a completely empty state
    const sim = newSim()
    this.lock = new AsyncLock()

    this.state = {
      "sim": sim,
      "requestedActions": instTwoTopics,
      "lock": {
        "owner": 0,
        "isLocked": false
      },
      "intervalOne": null
    }
  }
  lockTickTock() {
    const nonce = Math.floor( Math.random() * 100000 ) // Our "key"

    //console.log(`lock(${nonce}) tick, tock: `)
    this.lock.acquire('sim', function() {
      if (!this.state.lock.isLocked) { //Do not even attempt to use the lock if state is bad
        this.setState({...this.state,  //This informs the world what state we locked into
          lock: {
          "owner": nonce,
          "isLocked": true
        }
        }, () => { this.setState(tick(this.state, nonce)) } )// This applies a tick(), which also clears the "lock"
      } else {
        console.log(`lockTickTock: Skipping update, simulator left in "locked" state by ${this.state.nonce}.`)
      }
    }.bind(this))
  }

  requestAction (action, payload) {
    if(!this.state.lock.isLocked){
      this.setState({ ...this.state,
        requestedActions: [...this.state.requestedActions, {action: action, payload: payload}]
      })
    }

  }

  componentDidMount() {
    //Apply the initialization to state
    this.setState({
      intervalOne:  setInterval( () => this.lockTickTock(), 100 )
    })
  }

  render() {
  	return (
      <div className="k-sim">
        {/* <div className="k-sim-buttons">
          <button className="force-tick" onClick = {() => this.lockTickTock()}>tick!</button>
        </div> */}
        <div className="k-sim-content">
          {/* <KSimCtl sim={this.state.sim} requestAction={(action, payload)=>{this.requestAction(action, payload)}}/> */}
          <KSimVis sim={this.state.sim} svgWidth={600} svgHeight={600} maxTopics={3}/>
        </div>
      </div>
    );
  }
}

export default KSim;
