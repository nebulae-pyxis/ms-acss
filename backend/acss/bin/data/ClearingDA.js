"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const OpenClearingCollectionName = "Clearing";
const ClosedClearingCollectionName = "ClosedClearing";
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
   * gets all the clearing of a business
   *
   * @param {int} page Indicates the page number which will be returned
   * @param {int} count Indicates the amount of rows that will be returned
   * @param {int} businessId Id of the business
   * @returns {Observable}
   */
  static getClearingsFromBusiness$(page, count, businessId) {
    return Rx.Observable.defer(()=>{
      if(page != 0){
        return Rx.Observable.of([])
      }

      const collection = mongoDB.db.collection(OpenClearingCollectionName);
      return collection
        .find({businessId: businessId})
        .limit(1)
        .toArray();
    }).mergeMap(openClearing => {

      countClosedClearing = openClearing.length == 0 ? count-1: count;

      return Rx.Observable.forkJoin(
        openClearing,
        Rx.Observable.defer(()=>{
        const collection = mongoDB.db.collection(ClosedClearingCollectionName);
        return collection
          .find({businessId: businessId})
          .sort({timestamp: -1})
          .skip(countClosedClearing * page)
          .limit(countClosedClearing)
          .toArray();
        })
      )
      .map(([openClearingArray, closedClearingArray]) => [...openClearingArray, ...closedClearingArray])
    });
  }

  /**
   * 
   */
  getClearings(collectionName, open){
    return Rx.Observable.defer(()=>{
      const collection = mongoDB.db.collection(collectionName);
      return collection
        .find({businessId: businessId})
        .sort({timestamp: -1})
        .skip(countClosedClearing * page)
        .limit(countClosedClearing)
        .toArray();
    })
    .mergeMap(clearings => Rx.Observable.from(clearings))
    .map(clearing => {
      const clearingData = {
        _id: clearing.id,
        timestamp: clearing.timestamp,
        lastUpdateTimestamp: clearing.lastUpdateTimestamp,
        businessId: clearing.businessId,
        input: [],
        output: [],
        open: open,        
      };

      
      //clearingData.input.push();
      return clearingData;
    });
  }

  /**
   * Gets the clearing associated  with a business
   * @param {*} businessId ID of the business
   */
  static getOpenClearingByBusinessId$(businessId) {
    const collection = mongoDB.db.collection(OpenClearingCollectionName);
    return Rx.Observable.defer(() => collection.findOne({ 'businessId': id }));
  } 

  /**
   * Executes the array of operations on Mongo
   * @param {*} collectionVsOperationAndCommand array of Mongo operations
   */
  static executeOperations$(collectionVsOperationAndCommand) {
    return mongoDB.applyAll$(collectionVsOperationAndCommand);
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
