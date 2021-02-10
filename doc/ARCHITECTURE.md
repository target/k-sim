# Architecture
Here's how the project is laid out, and generally how things work.

There are three main sections of k-sim:
- `k-sim/engine`: nuts and bolts of simulation state changes, internal and requested (State)
- `k-sim/vis`: visualization of current simulation state (Component+SVG stuff)
- `k-sim/ctl`: visual elements that allow interaction with the engine (Components)

We provide a basic UX at `k-sim/KSim.js` that initializes an engine's state, and loads basic visualizations/controls.


## k-sim/engine - the model of "idealized" Kafka
_NOTE: This may not be kept up to date_
See [../exampleState.json](../exampleState.json) for the last example we checked in.

### Flat collections
```json
{
    "clusters": {},
    "brokers": {},

    "topics": {},
    "partitions": {},
    "replicas": {},

    "groups": {},
    "instances": {}
}
```

Our model tries to be **flat**, and use ids as **relational references**.  
We didn't intentionally normalize it too much, just enough to make sure we honor the addage: _Don't Repeat Yourself_

> ***NOTE:*** With regards to IDs, **DO NOT** rely on parsing them.  Just pass them around, and treat them like random GUIDs.

The object collections in the model should expect to be organized like this:
```json
"clusters": {
        "byId": {
            "c0": {
                "id": "c0",
                "more": "data was removed"
            }
        },
        "ids": [
            "c0"
        ],
}
```

Generally speaking, we are inconsistent about getting/setting methods vs model access/manipulation.
We would appreciate help there!

## k-sim/engine - Locking Ticking and Tocking
> The state of state management

For a few days, we furiously pondered a rewrite in Redux. 
Mistaken or not, we ended up with a system that looks and smells like dispatched actions.
Here's what we ended up with:

### What's to be done?
In order to simulate the distributed system, we have to do two main tasks:
1. Add and remove actors from the model, (and update their relationships.)
2. Simulate interactions between them over time, usually resulting in changes to their internal state.

Because we're _simulating_ the world, we can decide precisely when each of these things happen.
Then, we can execute updates to the model in that order.

One last problem: We're building this as a stand-alone browser application. 
Timing of when our simulator runs isn't always guaranteed.

### How do we do it?
Every ___ milliseconds, a setInterval needs to update the system. Here's the nested, three-phase action it fires:

1. Lock: ensure one state update at a time
    - Agree that nothing other than `tick()` will modify the sim-state
    - Have `tick()` only launch if it acquires an `async-lock` 
    - Inform the rest of the application that sim-state is locked and about to change
    - In the now-locked context, invoke an `setState(tick(...))`
1. Tick: perform "large" changes to actors in the model
    - Apply all the "Actions" requested from outside the engine itself
    - Add/Remove/Rebalance objects based on those actions
    - return the value of `tock(new-sim-state)`
1. Tock: perform "small" interactions between actors
    - Shuffle the order of all actor-initiated changes
    - Sequentially apply the actor initiated changes to internal state
    - If needed, repeat various "action-sets" of this type
        - **NOTE:** as of early 2021, there is only one general pool of actor-initiated changes
    - Update the finalized sim-state to remove the "locked" status
    - return this finalized sim-state to `tick()`

## k-sim/vis - drawing Kafka pictures with React

TODO: Write this documentation.


## k-sim/ctl - interact with the engine

TODO: Write this code, and then this documentation.