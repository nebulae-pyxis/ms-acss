"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionName = "Transactions";
const MongoDB = require('./MongoDB').MongoDB;
const { CustomError } = require("../tools/customError");

class TransactionsDA {

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
   * returns a transaction stream of trasactions beggining with the cursor up to the limit timestamp
   * @param String cursor cursor describing where to start
   * @param  number timestampLimit timestamp limit to stop the stream
   * @returns {Rx.Observable}
   */
  static getTransactions$(cursor, timestampLimit = Date.now()) {
    const collection = mongoDB.db.collection(CollectionName);
    const findQuery = {
      timestamp: { '$lte': timestampLimit }
    };
    if (cursor) {
      findQuery.timestamp['$gt'] = cursor.timestamp;
    }
    return Rx.Observable.bindNodeCallback(collection.find.bind(collection))(findQuery)
      .mergeMap(cursor => Rx.Observable.defer(() => MongoDB.extractAllFromMongoCursor$(cursor)));
  }

  /**
   * create transactions
   * @param {array} transactions array
   * @returns {Rx.Observable} Rx.Observable
   */
  static createTransactions$(transactions) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() => collection.insertMany(transactions))
    .pluck('ops')
    .map(ops => ops.map(o=>o._id));
  }


}

/**
 * Returns a TransactionsDA
 * @returns {TransactionsDA}
 */
module.exports = TransactionsDA;
