"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionName = "Business";
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
   * Creates a new business
   * @param {*} business business to create
   */
  static persistBusiness$(business) {
    const collection = mongoDB.db.collection(CollectionName);    
    const businessData = {
      _id: business._id,
      name: business.generalInfo.name
    };
    return Rx.Observable.defer(() => collection.insertOne(businessData));
  }

  /**
   * modifies the general info of the indicated business 
   * @param {*} id  Business ID
   * @param {*} businessGeneralInfo  New general information of the business
   */
  static updateBusinessGeneralInfo$(id, businessGeneralInfo) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(()=>
        collection.findOneAndUpdate(
          { _id: id },
          {
            $set: {name: businessGeneralInfo.name}
          },{
            returnOriginal: false
          }
        )
    ).map(result => result && result.value ? result.value : undefined);
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
