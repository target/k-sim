// instAddSimpleFlow:
//   - Example set of instructions that add a new flow to the system
//   NOTE:  This depends on "default-target: reuse-highest" behavior.
//          EXAMPLE: Add a broker, set parent to last cluster created (highest id available)
//          EXAMPLE: Add a topic? set cluster to highest id
//          EXAMPLE: Add a group? set cluster to highest, and topic to highest within that cluster
//          EXAMPLE: Add a consumer?  set group to highest and topic to highest id

export const instAddSimpleFlow = [
    // Add CLUSTER
    {'action': 'addCluster', 'payload': {'name': 'example-cluster'} }, // FIXME: This will cause "name" clashes. c0

    // Add BROKERs to our cluster
    {'action': 'addBroker', 'payload': {} }, // c0b0
    {'action': 'addBroker', 'payload': {} }, // c0b1
    {'action': 'addBroker', 'payload': {} }, // c0b2

    // Add a TOPIC to our cluster
    {'action': 'addTopic',  //NOTE: This directive adds all partitions as well
        'payload': { // c0t0
            'name': 'example-topic',
            'numReplicas': 2     // topics will not be allowed to change replica targets.
        } 
    },
    {'action': 'addPartition', 'payload': { }}, // c0t0p0, c0t0p0r0 + c0t0p0r1
    {'action': 'addPartition', 'payload': { }}, // c0t1p0, c0t1p0r0 + c0t1p0r1
    {'action': 'addPartition', 'payload': { }}, // c0t2p0, c0t2p0r0 + c0t2p0r1

    // Add an INSTANCE (producer) 
    {'action': 'addInstance', // i0
        'payload': {
            'name': 'simpleProducer-0',
            'perfData': { 'capacity': 10 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'type': 'simpleSource', 'rateLimit': 4 }},  
    {'action': 'addDrain',  'payload': { 'type': 'topic', 'rateLimit': 999 }}, // to topic c0t0
  
    // Add a GROUP (for consumers)
    {'action': 'addGroup',  'payload': {} }, // g0 (consumer group on topic c0t0)

    // Add an INSTANCE (consumer)
    {'action': 'addInstance', // i1
        'payload': {
            'name': 'simpleConsumer-0',
            'perfData': { 'capacity': 5 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'type': 'group', 'rateLimit': 999 }},  // in g0, from c0t0
    {'action': 'addDrain',  'payload': { 'type': 'simpleDrain', 'rateLimit': 4 }}, 
    
    // Add an INSTANCE (consumer)
    {'action': 'addInstance', // i2
        'payload': {
            'name': 'simpleConsumer-1',
            'perfData': { 'capacity': 5 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'type': 'group', 'rateLimit': 999 }},  // in g0, from c0t0
    {'action': 'addDrain',  'payload': { 'type': 'simpleDrain', 'rateLimit': 4 }}, 
]
