// instAddSimpleFlow:
//   - Example set of instructions that add a new flow to the system
//   NOTE:  This depends on "default-target: reuse-highest" behavior.
//          EXAMPLE: Add a broker, set parent to last cluster created (highest id available)
//          EXAMPLE: Add a topic? set cluster to highest id
//          EXAMPLE: Add a group? set cluster to highest, and topic to highest within that cluster
//          EXAMPLE: Add a consumer?  set group to highest and topic to highest id

export const instTwoTopics = [
    // Add CLUSTER
    {'action': 'addCluster', 'payload': {'name': 'example-cluster'} }, // FIXME: This will cause "name" clashes. c0

    // Add BROKERs to our cluster
    {'action': 'addBroker', 'payload': {} }, // b0
    {'action': 'addBroker', 'payload': {} }, // b1
    {'action': 'addBroker', 'payload': {} }, // b2

    // Add a TOPIC to our cluster
    {'action': 'addTopic',  //NOTE: This directive adds all partitions as well
        'payload': { // c0t0
            'name': 'example-topic',
            'numReplicas': 2     // topics will not be allowed to change replica targets.
        }
    },

    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //

    // Add a GROUP (for consumers)
    {'action': 'addGroup',  'payload': {} }, // g0 (consumer group on topic c0t0)

    // Add second TOPIC to our cluster
    {'action': 'addTopic',  //NOTE: This directive adds all partitions as well
        'payload': { // c0t0
            'name': 'example-topic',
            'numReplicas': 2     // topics will not be allowed to change replica targets.
        }
    },

    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //
    {'action': 'addPartition', 'payload': { }}, //

    // Add a GROUP (for consumers)
    {'action': 'addGroup',  'payload': {} }, // g1 (consumer group on topic c0t0)

    // Add an INSTANCE (producer)
    {'action': 'addInstance', // i0
        'payload': {
            'name': 'simpleProducer-0',
            'perfData': { 'capacity': 10 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'instanceID': 'i0', 'type': 'simpleSource', 'rateLimit': 4 }},
    {'action': 'addDrain',  'payload': { 'instanceID': 'i0', 'id': 'c0t0', 'type': 'topic', 'rateLimit': 999 }},

    {'action': 'addInstance', // i1
        'payload': {
            'name': 'simpleProducer-1',
            'perfData': { 'capacity': 10 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'instanceID': 'i1', 'type': 'simpleSource', 'rateLimit': 4 }},
    {'action': 'addDrain',  'payload': { 'instanceID': 'i1', 'id': 'c0t0', 'type': 'topic', 'rateLimit': 999 }},

    {'action': 'addInstance', // i2
        'payload': {
            'name': 'overloadedProducer-1',
            'perfData': { 'capacity': 10 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'instanceID': 'i2', 'type': 'simpleSource', 'rateLimit': 6 }},
    {'action': 'addDrain',  'payload': { 'instanceID': 'i2', 'id': 'c0t0', 'type': 'topic', 'rateLimit': 999 }},

    // Add an INSTANCE (mid-tier)
    {'action': 'addInstance', // i3
        'payload': {
            'name': 'midTier-0',
            'perfData': { 'capacity': 10 },
            'backlog': { 'maxBacklog': 100 }
        }
    },

    // Add an INSTANCE (mid-tier)
    {'action': 'addInstance', // i4
        'payload': {
            'name': 'midTier-1',
            'perfData': { 'capacity': 10 },
            'backlog': { 'maxBacklog': 100 }
        }
    },

    // Add an INSTANCE (mid-tier)
    {'action': 'addInstance', // i5
        'payload': {
            'name': 'midTier-2',
            'perfData': { 'capacity': 10 },
            'backlog': { 'maxBacklog': 100 }
        }
    },

    // Wire-up mid-tier
    //// SOURCES
    {'action': 'addSource', 'payload': { 'instanceId': 'i3', 'id': 'c0g0', 'type': 'group', 'rateLimit': 999 }},
    {'action': 'addSource', 'payload': { 'instanceId': 'i4', 'id': 'c0g0', 'type': 'group', 'rateLimit': 999 }},
    {'action': 'addSource', 'payload': { 'instanceId': 'i5', 'id': 'c0g0', 'type': 'group', 'rateLimit': 999 }},

    //// DRAINS
    {'action': 'addDrain',  'payload': { 'instanceId': 'i3', 'id': 'c0t1', 'type': 'topic', 'rateLimit': 999 }},
    {'action': 'addDrain',  'payload': { 'instanceId': 'i4', 'id': 'c0t1', 'type': 'topic', 'rateLimit': 999 }},
    {'action': 'addDrain',  'payload': { 'instanceId': 'i5', 'id': 'c0t1', 'type': 'topic', 'rateLimit': 999 }},


    // Finally, add final-topic-to-drain (we don't need to know IDs, we can use defaults)
    {'action': 'addInstance',
        'payload': {
            'name': 'dbTier-0',
            'perfData': { 'capacity': 8 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'id': 'c0g1', 'type': 'group', 'rateLimit': 999 }},
    {'action': 'addDrain',  'payload': { 'type': 'simpleDrain', 'rateLimit': 5 }},

    {'action': 'addInstance',
        'payload': {
            'name': 'dbTier-0',
            'perfData': { 'capacity': 8 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'id': 'c0g1', 'type': 'group', 'rateLimit': 999 }},
    {'action': 'addDrain',  'payload': { 'type': 'simpleDrain', 'rateLimit': 5 }},

    {'action': 'addInstance',
        'payload': {
            'name': 'dbTier-0',
            'perfData': { 'capacity': 8 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'id': 'c0g1', 'type': 'group', 'rateLimit': 999 }},
    {'action': 'addDrain',  'payload': { 'type': 'simpleDrain', 'rateLimit': 5 }},

    {'action': 'addInstance',
        'payload': {
            'name': 'dbTier-0',
            'perfData': { 'capacity': 8 },
            'backlog': { 'maxBacklog': 100 }
        }
    },
    {'action': 'addSource', 'payload': { 'id': 'c0g1', 'type': 'group', 'rateLimit': 999 }},
    {'action': 'addDrain',  'payload': { 'type': 'simpleDrain', 'rateLimit': 5 }},
]
