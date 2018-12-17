const Rx = require("rxjs");
const broker = require("../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const ClearingDA = require("../data/ClearingDA");
const LogErrorDA = require('../data/LogErrorDA');
const AccumulatedTransactionDA = require("../data/AccumulatedTransactionDA");
const NumberDecimal = require('mongodb').Decimal128;

let instance;


class TransactionAccumulatedEventConsumer {
  constructor() {}

  /**
   * Listens the transaction accumulated event and performs the required operations to update the clearing of each involved business
   *
   * @param {*} transactionAccumulatedEvent Accumulated txs event
   * @returns {Observable}
   */
  handleTransactionAccumulatedEvent$(transactionAccumulatedEvent) {
    const txIds = transactionAccumulatedEvent.data;

    //Iterates over the array of accumulated tx ids
    return Rx.Observable.from(txIds.ids)
        //Gets each accumulated tx from Mongo
        .mergeMap(accumulatedTxId => AccumulatedTransactionDA.getAccumulatedTransaction$(accumulatedTxId))
        .mergeMap(accumulatedTx => this.generateClearingOperations$(accumulatedTx))
        .toArray()
        //at the end these operations will be executed in only one transaction.
        .mergeMap(mongoOperations => ClearingDA.executeOperations$(mongoOperations))
        .map(val => `Clearings updated ; ok:${val}`)
        .catch(error => {
          console.log(`An error was generated while a clearing was being updated: ${error.stack}`);
          return this.errorHandler$(error.stack, transactionAccumulatedEvent);
        });
  }

  /**
   * Error handler
   * @param {*} error 
   * @param {*} event 
   */
  errorHandler$(error, event){
    return Rx.Observable.of({error, event})
    .mergeMap(log => LogErrorDA.persistClearingError$(log))
  }

  /**
   * Generates needed Mongo operations accroding to each accumulated transaction
   * @param {*} accumulatedTx Accumulated transaction
   * @returns {Observable}
   */
  generateClearingOperations$(accumulatedTx) {
    //For each accumulated transaction, we have to perform increments over the
    //clearing of each business associated with the transaction.
    return Rx.Observable.from([accumulatedTx.fromBu, accumulatedTx.toBu]).map(
      businessId => {
        const isFromBusiness = accumulatedTx.fromBu == businessId;
        const timestamp = Date.now();

        //Since all of the operations have to be done in an transactional environment,
        //we have to generate the JSON with the Mongo operations that will be executed on Mongo,
        const mongoOperation = {
          collection: "Clearing",
          operation: "updateOne",
          operationArgs: [
            { businessId: businessId, open: true },
            {
              $set: { lastUpdateTimestamp: timestamp },
              $push: { accumulatedTransactionIds: accumulatedTx._id },
              $setOnInsert: {
                timestamp: timestamp,
                businessId: businessId,
                open: true
              }
            }
          ],
          operationOps: { upsert: true }
        };

        const dynamicObj = {};
        const propertyKey = isFromBusiness
          ? `output.${accumulatedTx.toBu}.amount`
          : `input.${accumulatedTx.fromBu}.amount`;
        dynamicObj[propertyKey] = NumberDecimal.fromString(accumulatedTx.amount.toString()),
        mongoOperation.operationArgs[1]["$inc"] = dynamicObj;
        return mongoOperation;
      }
    );
  }
}

/**
 * Transaction accumulated event consumer
 * @returns {TransactionAccumulatedEventConsumer}
 */
module.exports = () => {
  if (!instance) {
    instance = new TransactionAccumulatedEventConsumer();
    console.log("TransactionAccumulatedEventConsumer Singleton created");
  }
  return instance;
};
