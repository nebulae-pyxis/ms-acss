"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionName = "AccumulatedTransactions";
const { CustomError } = require("../tools/customError");

class ClearingDA {

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
   * Gets the accumulated transaction by id
   * @param {*} accumulatedTransactionId ID of the accumulated transaction
   */
  static getAccumulatedTransaction$(accumulatedTransactionId) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() => collection.findOne({ '_id': accumulatedTransactionId }));
  } 


    /**
   * Extracts the next value from a mongo cursor if available, returns undefined otherwise
   * @param {*} cursor
   */
  static async extractNextFromMongoCursor(cursor) {
    const hasNext = await cursor.hasNext();
    if (hasNext) {
      const obj = await cursor.next();
      return obj;
    }
    return undefined;
  }
}

/**
 * Returns a ClearingDA
 * @returns {ClearingDA}
 */
module.exports = ClearingDA;
