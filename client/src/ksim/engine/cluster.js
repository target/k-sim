export const makeReplicaPlacement = (sim, clusterId, replicaId) => {
    // Figure out what brokerId should take the next replica

    let lowestWeight = Infinity //Handy!
    let winningBroker = null
    for( let bId of sim.clusters.byId[clusterId].brokers ) {
        let score = 0
        for ( let rId of sim.brokers.byId[bId].replicas ) {
            score++
            if (rId.endsWith('r0')) {
                score += 2 // leading a partition is worth more
            }
        }
        if (score < lowestWeight) {
            winningBroker = bId
            lowestWeight = score
        }
    }

    return(winningBroker) // Will return null if there's no brokers in the list! look out!
}