const Rx = require('rxjs');
const broker = require('../tools/broker/BrokerFactory')();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const BusinessDA = require('../data/BusinessDA');

let instance;

class BusinessEventConsumer {

    constructor() {

    }

    /**
     * Persists the business on the materialized view according to the received data from the event store.
     * @param {*} businessCreatedEvent business created event
     */
    handleBusinessCreated$(businessCreatedEvent) { 
        console.log('handleBusinessCreated$', businessCreatedEvent); 
        const business = businessCreatedEvent.data;
        return BusinessDA.persistBusiness$(business);
    }

    /**
     * updates the business general info on the materialized view according to the received data from the event store.
     * @param {*} businessGeneralInfoUpdatedEvent business general info updated event
     */
    handleBusinessGeneralInfoUpdated$(businessGeneralInfoUpdatedEvent) {  
        console.log('businessGeneralInfoUpdatedEvent$', businessGeneralInfoUpdatedEvent); 
        const businessGeneralInfo = businessGeneralInfoUpdatedEvent.data;
        return BusinessDA.updateBusinessGeneralInfo$(businessGeneralInfoUpdatedEvent.aid, businessGeneralInfo);
    }

}

/**
 * Business event consumer
 * @returns {BusinessEventConsumer}
 */
module.exports = 
() => {
    if (!instance) {
        instance = new BusinessEventConsumer();
        console.log('BusinessEventConsumer Singleton created');
    }
    return instance;
};