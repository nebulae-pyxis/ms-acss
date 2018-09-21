"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const CollectionName = "Business";
const { CustomError } = require("../tools/customError");

class BusinessDA {

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
   * Gets business by id
   * @param {String} id business ID
   */
  static getBusiness$(id) {
    const collection = mongoDB.db.collection(CollectionName);
    return Rx.Observable.defer(() => collection.findOne({ '_id': id }));
  }

   /**
   * Gets business by ids
   * @param {String[]} ids Ids of the business to recover.
   */
  static getBusinessByIds$(ids) {
    return Rx.Observable.create(async observer => {
      const collection = mongoDB.db.collection(CollectionName);
    const cursor = collection.find({ '_id': {$in: ids} });
      let obj = await this.extractNextFromMongoCursor(cursor);
      while (obj) {
        observer.next(obj);
        obj = await this.extractNextFromMongoCursor(cursor);
      }

      observer.complete();
    });
  }


  /**
   * Gets all businesses from the database using a iterator
   */
  static getAllBusinesses$() {
    return Rx.Observable.create(async observer => {
      const collection = mongoDB.db.collection(CollectionName);
      const cursor = collection.find({});
      let obj = await this.extractNextFromMongoCursor(cursor);
      while (obj) {
        observer.next(obj);
        obj = await this.extractNextFromMongoCursor(cursor);
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
 * Returns a BusinessDA
 * @returns {BusinessDA}
 */
module.exports = BusinessDA;
