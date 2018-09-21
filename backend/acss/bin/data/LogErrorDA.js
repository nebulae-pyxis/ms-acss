"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionNameClearingError = "ClearingError";
const CollectionNameAccumulatedTransactionsError = "AccumulatedTransactionsError";

class LogErrorDA {

  static start$(mongoDbInstance) {
    return Rx.Observable.create((observer) => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next('using given mongo instance ');
      } else {
        mongoDB = require('./MongoDB').singleton();
        observer.next('using singleton system-wide mongo instance');
      }
      observer.complete();
    });
  }

  /**
   * Creates a clearing error
   * @param {*} log data to persist
   * @param {*} log.error Error detail
   * @param {*} log.event event where the error was generated 
   */
  static persistClearingError$(log) {
    return this.persistLogError$(CollectionNameClearingError, log);
  }

  /**
   * Creates a accumulating transaction error
   * @param {*} log data to persist
   * @param {*} log.error Error detail
   * @param {*} log.event event where the error was generated 
   */
  static persistAccumulatedTransactionsError$(log) {
    return this.persistLogError$(CollectionNameAccumulatedTransactionsError, log);
  }

  /**
   * Creates an error log
   * @param {*} log data to persist
   * @param {*} log.error Error detail
   * @param {*} log.event event where the error was generated 
   */
  static persistLogError$(collectionName, log) {
    const collection = mongoDB.db.collection(collectionName);    
    const logErrorData = {
      error: log.error,
      timestamp: Date.now(),
      event: log.event
    };
    return Rx.Observable.defer(() => collection.insertOne(logErrorData));
  }

}

/**
 * Returns a LogErrorDA
 * @returns {LogErrorDA}
 */
module.exports = LogErrorDA;
