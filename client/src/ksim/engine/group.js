import { cloneDeep, has } from "lodash"

export const groupRebalanceTopic = (sim, groupId, topicId) => {
    if (sim.groups.byId[groupId].consumers.length === 0) { return (sim) }

    let cPtr = -1 
    let newTopicMap = {}
    for (let pId of sim.topics.byId[topicId].partitions) { 
        cPtr++
        if (cPtr === sim.groups.byId[groupId].consumers.length) { cPtr = 0 }
        
        let currentOffset = 0 // FIXME: this needs to locate the actual correct offset!
        if (has(sim.groups.byId[groupId].topicMapping, pId)) { 
            currentOffset = sim.groups.byId[groupId].topicMapping[pId].offset 
        }

        newTopicMap[pId] = {
            "instanceId": sim.groups.byId[groupId].consumers[cPtr],
            "offset": currentOffset
        }
    }

    const updatedSim = cloneDeep (sim)

    updatedSim.groups.byId[groupId].topicMapping[topicId] = newTopicMap

    return(updatedSim)
}