"use strict";

let mongoDB = undefined;
const BusinessDA = require("./BusinessDA");
const Rx = require("rxjs");
const CollectionName = "AccumulatedTransactions";
const { CustomError } = require("../tools/customError");
const ObjectID = require('mongodb').ObjectID;

class AccumulatedTransactionDA {

  static start$(mongoDbInstance) {
    return Rx.Observable.create(observer => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next("using given mongo instance ");
      } else {
        mongoDB = require("./MongoDB").singleton();
        observer.next("using singleton system-wide mongo instance");
      }
      observer.complete();
    });
  }


  /**
   * takes an array of accumulated transactions and creates a single insert statement
   * @param {Array} accumulatedTransactions 
   * @returns {Rx.Observable} insert statement
   */
  static generateAccumulatedTransactionsStatement$(accumulatedTransactions) {
    return Rx.Observable.of(accumulatedTransactions)
      .map(ats => {
        return {
          collection: CollectionName,
          operation: "insertMany",
          operationArgs: [ats]
        };
      });
  }

  /**
   * Gets the accumulated transaction by id
   * @param {*} accumulatedTransactionId ID of the accumulated transaction
   */
  static getAccumulatedTransaction$(accumulatedTransactionId) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() =>
      collection.findOne({ _id: new ObjectID.createFromHexString(accumulatedTransactionId) })
    );
  }

  /**
   * gets all the accumulated transactions by its id
   *
   * @param {int} page Indicates the page number which will be returned
   * @param {int} count Indicates the amount of rows that will be returned
   * @param {[String]]} ids accumulated transaction ids to query.
   */
  static getAccumulatedTransactionsByIds$(page, count, ids) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() =>
      collection
        .find({ _id: { $in: ids } })
        .sort({ timestamp: -1 })
        .skip(count * page)
        .limit(count)
        .toArray()
    )
      .mergeMap(accumulatedTransactions => {

        const buNamesMap$ = Rx.Observable.from(accumulatedTransactions)
          .mergeMap(at => Rx.Observable.from([at.fromBu, at.toBu]))
          .distinct()
          .mergeMap(buId => BusinessDA.getBusinessByIds$([buId]).map(business => { return { id: business._id, name: business.name } }))
          .reduce((acc, val) => {
            acc[val.id] = val.name;
            return acc;
          }, {});

        return Rx.Observable.combineLatest(
          buNamesMap$,
          Rx.Observable.from(accumulatedTransactions)
        )
          .map(([cache, at]) => {
            const txIds = Object.keys(at.transactionIds).map(key => ({ type: key, ids: at.transactionIds[key] }));
            at.transactionIds = txIds;
            return { ...at, fromBusinessName: cache[at.fromBu], toBusinessName: cache[at.toBu] };
          })
      })
      .toArray();
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
 * Returns a AccumulatedTransactionDA
 * @returns {AccumulatedTransactionDA}
 */
module.exports = AccumulatedTransactionDA;
