"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionName = "TransactionsCursor";
const { CustomError } = require("../tools/customError");

class TransactionsCursorDA {

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
   * Gets current cursor
   * @returns {Rx.Observable} Rx.Observable
   */
  static getCursor$() {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() => collection.findOne({_id:'current'}))
    .do(x => console.log(JSON.stringify(x)))
    ;
  }

  /**
   * updates current cursor
   * @param {*} cursor
   * @returns {Rx.Observable} Rx.Observable resolves to result {updated: bool, created:bool }
   */
  static setCursor$(cursor) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() =>
      collection.updateOne(
        { _id: 'current' },
        {
          $set: { ...cursor }
        }, {
          upsert: true
        }
      ))
      .map(result => {
        return {
          ok: (result.result.n > 0),
          created: (result.upsertedCount > 0),
          updated: (result.modifiedCount > 0)
        };
      });
  }

}

/**
 * Returns a TransactionsCursorDA
 * @returns {TransactionsCursorDA}
 */
module.exports = TransactionsCursorDA;
