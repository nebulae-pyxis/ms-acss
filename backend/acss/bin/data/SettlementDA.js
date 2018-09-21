"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionName = "Settlements";

class SettlementDA {

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
   * takes an array of settlements  and creates a single insert statement
   * @param {Array} settlements 
   * @returns {Rx.Observable} insert statement
   */
  static generateSettlementInsertStatement$(settlements) {
    return Rx.Observable.of(settlements)
      .map(setts => {
        return {
          collection: CollectionName,
          operation: "insertMany",
          operationArgs: [setts]
        };
      });
  }

  /**
   * Gets the Settlement by id
   * @param {*} settlementId ID
   * @returns {Rx.Observable}
   */
  static getSettlement$(settlementId) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() =>
      collection.findOne({ _id: settlementId })
    );
  }

  /**
   * gets the amount of settlements associated with the specified clearing Id
   *
   * @param {String} clearingId Id of the clearing
   */
  static getSettlementsCountByClearingId$(clearingId) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() =>
      collection
        .count({
          clearingId: new ObjectID.createFromHexString(clearingId)
        })
    );
  }

      /**
   * gets all of the settlements associated with the specified clearing Id
   *
   * @param {int} page Indicates the page number which will be returned
   * @param {int} count Indicates the amount of rows that will be returned
   * @param {String} clearingId Id of the clearing
   */
  static getSettlementsByClearingId$(page, count, clearingId) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() =>
      collection
        .find({
          clearingId: new ObjectID.createFromHexString(clearingId)
        })
        .sort({ timestamp: -1 })
        .skip(count * page)
        .limit(count)
        .toArray()
    )
      .mergeMap(settlements => {
        const buNamesMap$ = Rx.Observable.from(settlements)
          .mergeMap(settlement => Rx.Observable.from([settlement.fromBu, settlement.toBu]))
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
            Rx.Observable.from(settlements).map(tx => [buNamesMap, settlement])
          )
          .map(([cache, settlement]) => {
            return {
              ...settlement,
              fromBusinessName: cache[settlement.fromBu],
              toBusinessName: cache[settlement.toBu]
            };
          });
      })
      .toArray();
  }


}

/**
 * Returns a SettlementDA
 * @returns {SettlementDA}
 */
module.exports = SettlementDA;
