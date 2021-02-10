import { cloneDeep, shuffle } from "lodash"

export const tickBroker = (id, sim) => {
    return(sim)
}

export const attemptProduce = (demand, instance, topicId, sim) => {
    let newSim = cloneDeep( sim )

    let t = sim.topics.byId[topicId]
    let pList = shuffle(t.partitions) //Randomly try them in order until we produce them all

    let producedRecords = 0
    for (let pId of pList) {
        if (demand === 0) { break } // No need to keep looking

        // Take the lowest available, should be sorted to have leader on top
        let rId = newSim.partitions.byId[pId].replicas[0] 
        let r = cloneDeep ( newSim.replicas.byId[rId] )

        // let b = newSim.brokers.byId[r.brokerId]
        let brokerTickCapacity = 1000 //TODO:  This needs to be loaded into model later
        let realizedDemand = Math.min(demand, brokerTickCapacity)

        producedRecords += realizedDemand
        r.maxOffset += realizedDemand

        newSim.replicas.byId[rId] = r
        demand -= realizedDemand
    }

    return [producedRecords, newSim]
}

export const attemptConsume = (demand, instance, groupId, sim) => {
    let nextSim = cloneDeep( sim )

    let g = cloneDeep ( nextSim.groups.byId[groupId] ) 
    var finalRecords = 0 

    for (let tId of g.topics) {
        if (demand === 0) { break }

        // let t = nextSim.topics.byId[tId]
        let topicMapping = g.topicMapping[tId]
        for (let pId in topicMapping) { // <- Iterating over keys
            if (demand === 0) { break }

            if (topicMapping[pId].instanceId === instance.id) {
                let rId = nextSim.partitions.byId[pId].replicas[0] // ASSUME: sorted in leader order
                let r = nextSim.replicas.byId[rId]
                let availRecords = Math.max(0 , (r.maxOffset - topicMapping[pId].offset) ) 

                let consumedRecords = Math.min(availRecords, demand)
                demand -= consumedRecords
                finalRecords += consumedRecords
                g.topicMapping[tId][pId].offset += consumedRecords
                //console.log(`(${instance.id}, ${rId})consumed ${consumedRecords}`)
            }
        }
    }

    nextSim.groups.byId[groupId] = g
    return [finalRecords, nextSim]
}

export const tickInstance = (id, sim) => {
    let nextSim = cloneDeep( sim )

    let i = cloneDeep( nextSim.instances.byId[id] )

    // We get a fresh amount of capacity each run
    let capacity = i.perfData.capacity

    //FIXME: Use helper functions by passing state?
    //TODO: loop for (let s in i.source) {
    let s = i.source
    switch (s.type) { 
        case 'simpleSource':
            let simpleSourceRecords = Math.min(s.rateLimit, capacity)
            capacity -= simpleSourceRecords
            i.backlog.backlog += simpleSourceRecords
            break;
        case 'group':
            let availBacklogCapacity = Math.max(0, i.backlog.maxBacklog - i.backlog.backlog)
            let availConsumeCapacity = Math.min(s.rateLimit, capacity, availBacklogCapacity)

            let consumedRecords
            [consumedRecords, nextSim] = attemptConsume(availConsumeCapacity, i, s.id, nextSim)

            capacity -= consumedRecords
            i.backlog.backlog += consumedRecords
            break;
        default:
            //invalid source, ignore!
            break;
    }


    let d = i.drain
    switch (d.type) { 
        case 'simpleDrain':
            let simpleDrainRecords = Math.min(d.rateLimit, capacity, i.backlog.backlog)
            capacity -= simpleDrainRecords
            i.backlog.backlog -= simpleDrainRecords
            break;
        case 'topic':
            let desiredDrainRecords = Math.min(d.rateLimit, capacity, i.backlog.backlog)
            let producedRecords
            [producedRecords, nextSim] = attemptProduce(desiredDrainRecords, i, d.id, nextSim)
            capacity -= producedRecords
            i.backlog.backlog -= producedRecords
            break;
        default:
            //invalid source, ignore!
            break;
    }

    if (i.backlog.backlog > i.backlog.maxBacklog) {
        i.backlog.dropped += (i.backlog.backlog - i.backlog.maxBacklog)
        i.backlog.backlog = i.backlog.maxBacklog
    }

    i.perfData.tickCapacity = capacity // leave remaining capacity for others
    nextSim.instances.byId[id] = i
    return(nextSim)
}


export const tockThing = (tType, id, sim) => {
    switch(tType) {
        case 'brokers':
            //TODO: Actually replicate records between brokers
            return(tickBroker(id,sim))
        case 'instances':
            //TODO: something
            return(tickInstance(id,sim))
        default:
            return(sim)
    }
}

export const calcTock = (sim) => {
    let nextSim = cloneDeep ( sim )
    //FIXME: don't just return the old state make a new one!

    const tickTypes = [ 'brokers', 'instances' ] // These things can take action

    let tickThings = []
    for (let tType of tickTypes) {
        for (let id of nextSim[tType].ids){ 
            tickThings.push([tType, id])
        }
    }

    const tickOrder = shuffle(tickThings)

    for (let [tType, id] of tickOrder) {
        nextSim = tockThing(tType, id, nextSim)
    }

    //console.log("tickOrder", tickOrder)
    return(nextSim) 
}
