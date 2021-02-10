import { applyActions } from './actions.js'
import { calcTock } from './tock.js'

export const newSim = () => {
    return( {
        "clusters":   { "byId": {}, "ids": [], "nextId": 0 }, // Globally unique cX
        "topics":     { "byId": {}, "ids": [], "nextId": 0 }, // Globally unique tX  (not required, but easy)
        "partitions": { "byId": {}, "ids": []  },  //do not global id num
        "brokers":    { "byId": {}, "ids": [], "nextId": 0 }, // Globally unique bX  (not required, but easy)
        "replicas":   { "byId": {}, "ids": []  },  //do not global id num
        "groups":     { "byId": {}, "ids": [], "nextId": 0 }, // Globally unique gX  (not required, but easy)
        "instances":  { "byId": {}, "ids": [], "nextId": 0 }, // Globally unique iX  

        "systemStats": {  // TODO: Consider a function that yields an empty systemStats state?
            "totalSourced": 0,
            "totalDrained": 0,
            "totalReplicated": 0, 
            "totalTicks": 0,
            "totalRequestedCapacity": 0,
            "totalUnusedCapacity": 0,
            "totalUsedCapacity": 0
        },
        "gen": 0,  // Generation number is not tick number, every mutation makes a new generation
        "selection": {
            "simType": null,
            "id": null,
            "details": null
        }
    })
}


export const tick = (state, nonce) => {

    //const sim = lockState() //TODO: actually implement locking

    if (state.lock.owner === nonce) {
        //TICK: Update the 'things' and their relationships
        const updatedSim = applyActions( state.sim, state.requestedActions )

        //TOCK: Update the dynamics of the things
        const finalSim = calcTock(updatedSim)
        //console.log('DELETEME final tick state', finalSim)
        return({
            ...state,
            sim: finalSim,
            requestedActions: [],
            lock: {
                "owner": 0,
                "isLocked": false
            }
        })
    } else {
        console.log(`       WHOA :  Skipping tick, my nonce(${nonce}) doesn't match lock owner(${state.lock.owner})`)
    }
}
