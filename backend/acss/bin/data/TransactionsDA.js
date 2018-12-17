"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionName = "Transactions";
const MongoDB = require("./MongoDB").MongoDB;
const NumberDecimal = require('mongodb').Decimal128;
const ObjectID = require("mongodb").ObjectID;
const BusinessDA = require("./BusinessDA");
const { CustomError } = require("../tools/customError");

class TransactionsDA {
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
   * Create a transaction
   * @param {*} transaction 
   */
  static createTransaction$(transaction){
    const collection = mongoDB.db.collection(CollectionName);

    return Rx.Observable.of(transaction)
    .map(transaction => ({ ...transaction, amount: NumberDecimal.fromString( transaction.amount.toString() )}))
    .mergeMap(data => Rx.Observable.defer(() => collection.insertOne(data)))
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
      timestamp: { $lte: timestampLimit }
    };
    if (cursor) {
      findQuery.timestamp["$gt"] = cursor.timestamp;
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
      .pluck("ops")
      .map(ops => ops.map(o => o._id));
  }

  /**
   * gets all the transactions by its id
   *
   * @param {int} page Indicates the page number which will be returned
   * @param {int} count Indicates the amount of rows that will be returned
   * @param {[String]]} ids transaction ids to query.
   * @param {String} businessId indicates the business which will be used to filter the data
   */
  static getTransactionsByIds$(page, count, ids, businessId) {
    const filter = {
      _id: { $in: ids.map(id => new ObjectID.createFromHexString(id.toString())) }
    };

    if(businessId){
      filter["$or"]= [{fromBu: businessId}, {toBu: businessId}]
    }

    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() =>
      collection
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(count * page)
        .limit(count)
        .toArray()
    )
      .mergeMap(transactions => {
        const buNamesMap$ = Rx.Observable.from(transactions)
          .mergeMap(tx => Rx.Observable.from([tx.fromBu, tx.toBu]))
          .distinct()
          .mergeMap(buId =>
            BusinessDA.getBusinessByIds$([buId]).map(business => {
              return { id: business._id, name: business.name };
            })
          )
          .reduce((acc, val) => {
            acc[val.id] = val.name;
            return acc;
          }, {});

        return buNamesMap$
          .mergeMap(buNamesMap =>
            Rx.Observable.from(transactions).map(tx => [buNamesMap, tx])
          )
          .map(([cache, tx]) => {
            return {
              ...tx,
              amount: parseFloat(new NumberDecimal(tx.amount.bytes).toString()),
              fromBusinessName: cache[tx.fromBu],
              toBusinessName: cache[tx.toBu]
            };
          });
      })
      .toArray()
  }
}

/**
 * Returns a TransactionsDA
 * @returns {TransactionsDA}
 */
module.exports = TransactionsDA;
