import { has } from "lodash"

export const hasRequiredKeys = (payload, keys, label) => {
    for (let k of keys) {
        if (!has(payload, k)) {
            console.log(`${label} invoked, payload missing required key ${k}`, payload)
            return(false)
        }
    }
    return(true)
}


// Returns an instanceId list whose members are configured to drain to the topic
export const whatDrainsToTopic = (topicId, sim) => {
    if (sim.instances.byId.length === 0) {return ([])}
    var instanceSet = new Set()
    for (let i of Object.values(sim.instances.byId)) {
        //TODO: for loop over all drains, when we add lists of drains
        if ( (i.drain !== null) && (i.drain.type === 'topic') && (i.drain.id === topicId) ) {
            instanceSet.add(i.id)
        }
    }
    return(Array.from(instanceSet))
}

// Returns an instanceId list whose members have partitions allocated by subscribed groups
export const whatSourcesFromTopic = (topicId, sim) => {
    if (sim.groups.byId.length === 0) {return ([])}
    var instanceSet = new Set()
    for (let g of Object.values(sim.groups.byId)) { // Iterate over values, not the ids themselves
        for (let tId in g.topicMapping) { // Iterate over keys, to save them
            if (tId === topicId) {
                for (let pId in g.topicMapping[tId]) { //iterate over keys to save them
                    instanceSet.add(g.topicMapping[tId][pId].instanceId)
                }
            }
        }
    }
    return(Array.from(instanceSet))
}

export const whatPartitionsInThisTopic = (topicId, sim) => {
    return(sim.topics.byId[topicId].partitions)
}

export const whatHostsThesePartitions = (partitions, sim) => {
    return([])
}