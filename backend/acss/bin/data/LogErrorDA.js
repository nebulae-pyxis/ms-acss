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
   * Gets accumulated transaction errors
   * @param {*} page Indicates the page number which will be returned
   * @param {*} count Indicates the max amount of rows that will be return.
   */
  static getAccumulatedTransactionErrors$(page, count) {
    return this.getLogError$(page, count, CollectionNameAccumulatedTransactionsError);
  }

  /**
   * Gets clearing errors
   * @param {*} page Indicates the page number which will be returned
   * @param {*} count Indicates the max amount of rows that will be return.
   */
  static getClearingErrors$(page, count) {
    return this.getLogError$(page, count, CollectionNameClearingError);
  }

  /**
   * Gets errors 
   * @param {*} page Indicates the page number which will be returned
   * @param {*} count Indicates the max amount of rows that will be return.
   * @param {*} collectionName 
   */
  static getLogError$(page, count, collectionName){
    const collection = mongoDB.db.collection(collectionName);
    return Rx.Observable.defer(() =>
      collection
        .find()
        .sort({ timestamp: -1 })
        .skip(count * page)
        .limit(count)
        .toArray()
    )
    .mergeMap(logErrors => {
      return Rx.Observable.from(logErrors)
    })
    .map(log => {
      return {
        error: log.error,
        timestamp: log.timestamp,
        event: JSON.stringify(log.event)
      }
    })
    .toArray();
  }

    /**
   * Gets amount of accumulated transaction errors
   */
  static getAccumulatedTransactionErrorsCount$() {
    return this.getLogErrorCount$(CollectionNameAccumulatedTransactionsError);
  }

  /**
   * Gets amount of clearing errors
   */
  static getClearingErrorsCount$() {
    return this.getLogErrorCount$(CollectionNameClearingError);
  }

  /**
   * Gets errors count
   * @param {*} collectionName 
   */
  static getLogErrorCount$(collectionName){
    const collection = mongoDB.db.collection(collectionName);
    return Rx.Observable.defer(() =>
      collection
        .countDocuments()
    );
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
