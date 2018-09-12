const Rx = require('rxjs');
const broker = require('../tools/broker/BrokerFactory')();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const ClearingDA = require('../data/ClearingDA');

let instance;

class TransactionAccumulatedEventConsumer {

    constructor() {

    }

    /**
     * Listens the transaction accumulated event.
     * 
     * Steps:
     * 1. Gets each accumulated transaction.
     * 2. Gets the sender and receiver of each accumulated transaction.
     * 3. Gets the clearing of the receiver and sender of each tx. (If the sender or receiver does not 
     * have a clearing with state Open, a new clearing will be created).
     * 
     * 
     * @param {*} transactionAccumulatedEvent Accumulated txs event
     * @returns {Observable} 
     */
    handleTransactionAccumulatedEvent$(transactionAccumulatedEvent) {
        console.log('transactionAccumulatedEvent$', transactionAccumulatedEvent); 
        const data = transactionAccumulatedEvent.data;
        return ClearingDA.persistBusiness$(data);
    }

}

/**
 * Transaction accumulated event consumer
 * @returns {TransactionAccumulatedEventConsumer}
 */
module.exports = 
() => {
    if (!instance) {
        instance = new TransactionAccumulatedEventConsumer();
        console.log('TransactionAccumulatedEventConsumer Singleton created');
    }
    return instance;
};