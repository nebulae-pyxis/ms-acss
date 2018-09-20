"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionNameClearingJobError = "ClearingJobError";
const CollectionNameClearingUpdateError = "ClearingUpdateError";

class ClearingJobErrorDA {

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
   * Creates a clearing job error
   * @param {*} log data to persist
   * @param {*} log.error Error detail
   * @param {*} log.event event where the error was generated 
   */
  static persistClearingJobError$(log) {
    const collection = mongoDB.db.collection(CollectionNameClearingJobError);    
    const clearingJobErrorData = {
      error: log.error,
      timestamp: Date.now(),
      event: log.event
    };
    return Rx.Observable.defer(() => collection.insertOne(clearingJobErrorData));
  }

    /**
   * Creates a clearing update error
   * @param {*} log data to persist
   * @param {*} log.error Error detail
   * @param {*} log.event event where the error was generated 
   */
  static persistClearingUpdateError$(log) {
    const collection = mongoDB.db.collection(CollectionNameClearingUpdateError);    
    const clearingUpdateErrorData = {
      error: log.error,
      timestamp: Date.now(),
      event: log.event
    };
    return Rx.Observable.defer(() => collection.insertOne(clearingUpdateErrorData));
  }
}

/**
 * Returns a ClearingJobErrorDA
 * @returns {ClearingJobErrorDA}
 */
module.exports = ClearingJobErrorDA;
