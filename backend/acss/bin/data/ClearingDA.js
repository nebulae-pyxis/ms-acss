"use strict";

let mongoDB = undefined;
const Rx = require("rxjs");
const ObjectID = require('mongodb').ObjectID;
const OpenClearingCollectionName = "Clearing";
const ClosedClearingCollectionName = "ClosedClearing";
const BusinessDA = require("./BusinessDA");
const NumberDecimal = require('mongodb').Decimal128;

class ClearingDA {
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

  static get openClearingCollectionName() {
    return OpenClearingCollectionName;
  }

  static get closedClearingCollectionName() {
    return ClosedClearingCollectionName;
  }


  /**
   * gets all the clearings of a business
   *
   * @param {int} page Indicates the page number which will be returned
   * @param {int} count Indicates the amount of rows that will be returned
   * @param {int} businessId Id of the business
   * @returns {Observable}
   */
  static getAllClearingsFromBusiness$(page, count, businessId) {
    return Rx.Observable.defer(() => {
      if (page != 0) {
        return Rx.Observable.of([]);
      }
      return this.getClearings$(
        OpenClearingCollectionName,
        businessId,
        page,
        1
      );
    }).mergeMap(openClearing => {
      const countClosedClearing = openClearing.length == 0 ? count - 1 : count;
      return Rx.Observable.forkJoin(
        Rx.Observable.of(openClearing),
        this.getClearings$(
          ClosedClearingCollectionName,
          businessId,
          page,
          countClosedClearing
        )
      ).map(([openClearingArray, closedClearingArray]) => {
        return [
          ...openClearingArray,
          ...closedClearingArray
        ]
      });
    });
  }

  /**
   * Get the clearings (Open and closed) associated with a specified business
   * @param {*} collectionName Collection name
   * @param {*} businessId Id of the business to query
   * @param {*} page Indicates the page number which will be returned
   * @param {*} count Indicates the max amount of rows that will be return.
   */
  static getClearings$(collectionName, businessId, page, count) {
    return Rx.Observable.defer(() => {
      const collection = mongoDB.db.collection(collectionName);
      return collection
        .find({ businessId: businessId })
        .sort({ timestamp: -1 })
        .skip(count * page)
        .limit(count)
        .toArray();
    })
      .mergeMap(clearings => Rx.Observable.from(clearings))
      .map(clearing => {
        clearing.partialSettlement = clearing.partialSettlement || {};

        clearing.input = this.transformMovements(clearing.input);
        clearing.output = this.transformMovements(clearing.output);
        clearing.partialSettlement.input = this.transformMovements(
          clearing.partialSettlement.input
        );
        clearing.partialSettlement.output = this.transformMovements(
          clearing.partialSettlement.output
        );

        return clearing;
      })
      .toArray();
  }

  /**
   * Gets the clearing associated  with a business
   * @param {*} businessId ID of the business
   */
  static getOpenClearingByBusinessId$(businessId) {
    const collection = mongoDB.db.collection(OpenClearingCollectionName);
    return Rx.Observable.defer(() => collection.findOne({ businessId, open: true }))
      .filter(obj => obj !== null);
  }
  
  /**
   * Gets the clearing by ID
   * @param {*} clearingId ID of the clearing
   * @param {*} businessId ID of the business
   */
  static getClearingByClearingId$(clearingId, businessId) {
    const filter ={ _id: new ObjectID.createFromHexString(clearingId) };
    if(businessId){
      filter["businessId"] = businessId;
    }

    //Looks for the clearing on the open clearing collection
    return (
      Rx.Observable.defer(() => {
        const collection = mongoDB.db.collection(OpenClearingCollectionName);
        return collection.findOne(filter);
      })
        //If the clearing was not found, we have to look for the clearing on the closed clearing collection
        .mergeMap(clearing => {
          if (clearing) {
            return Rx.Observable.of(clearing);
          }
          const collection = mongoDB.db.collection(
            ClosedClearingCollectionName
          );
          return collection.findOne(filter);
        })
        .mergeMap(clearing => {
          if (!clearing) {
            return Rx.Observable.of(null);
          }

          return Rx.Observable.forkJoin(
            Rx.Observable.of(clearing),
            //Get all of the businesses involved in the clearing
            Rx.Observable.of(clearing)
              .map(clearing => {
                clearing.input = clearing.input || {};
                clearing.output = clearing.output || {};
                clearing.partialSettlement = clearing.partialSettlement || {};
                clearing.partialSettlement.input =
                  clearing.partialSettlement.input || [];
                clearing.partialSettlement.output =
                  clearing.partialSettlement.output || [];
                return [
                  clearing.businessId,
                  ...Object.keys(clearing.input),
                  ...Object.keys(clearing.output),
                  ...Object.keys(clearing.partialSettlement.input),
                  ...Object.keys(clearing.partialSettlement.output)
                ];
              })
              //Get the businesses
              .mergeMap(businessIds => BusinessDA.getBusinessByIds$(businessIds).toArray())
          )
            .map(([clearing, businessArray]) => {
              const business = businessArray.find(business => business._id == clearing.businessId) || {};
              clearing.businessName = business.name;
              clearing.input = this.transformMovements(clearing.input, businessArray);
              clearing.output = this.transformMovements(clearing.output, businessArray);
              clearing.partialSettlement.input = this.transformPartialMovements(clearing.partialSettlement.input, businessArray);
              clearing.partialSettlement.output = this.transformPartialMovements(clearing.partialSettlement.output, businessArray);
              return clearing;
            });
        })

    );
  }

  /**
   * Executes the array of operations on Mongo
   * @param {*} collectionVsOperationAndCommand array of Mongo operations
   */
  static executeOperations$(collectionVsOperationAndCommand) {
    console.log('collectionVsOperationAndCommand => ', collectionVsOperationAndCommand);
    return mongoDB.applyAll$(collectionVsOperationAndCommand);
  }

  /**
   * Transforms the inputs and outputs object of the clearing in an array of inputs and outputs.
   *
   * This is necessary due to the inputs and outputs have the businessId as a property and this value is variable,
   * therefore its impossible to define the object in Graphql.
   *
   * @param {*} movements
   * @param {String[]} businessArray
   */
  static transformMovements(movements, businessArray = []) {
    const transformedMovements = [];
    if (movements) {
      Object.keys(movements).forEach(businessId => {
        const amount = parseFloat(new NumberDecimal(movements[businessId].amount.bytes).toString());
        const business = businessArray.find(business => business._id == businessId) || {};
        transformedMovements.push({ businessId, amount, businessName: business.name });
      });
    }
    return transformedMovements;
  }

    /**
   * Transforms the inputs and outputs object of the clearing in an array of inputs and outputs.
   *
   * This is necessary due to the inputs and outputs have the businessId as a property and this value is variable,
   * therefore its impossible to define the object in Graphql.
   *
   * @param {*} movements
   * @param {String[]} businessArray
   */
  static transformPartialMovements(movements, businessArray = []) {
    const transformedMovements = [];
    if (movements) {
      movements.forEach(movement => {
        const amount = parseFloat(new NumberDecimal(movement.amount.bytes).toString())
        const business = businessArray.find(business => business._id == movement.buId) || {};
        transformedMovements.push({ businessId: movement.buId, amount, businessName: business.name });
      });
    }
    return transformedMovements;
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


  /**
   * find and close (set open to false) a clearing
   * @param string businessId 
   * @returns {Rx.Observable} of result {found, closed, clearing}
   */
  static closeClearing$(businessId) {
    return Rx.Observable.defer(
      () => mongoDB.db.collection(OpenClearingCollectionName)
        .findOneAndUpdate(
          { businessId: businessId },
          { $set: { open: false, lastUpdateTimestamp: Date.now() } },
          { upsert: false, returnOriginal: false }
        ))
      //.do(x => console.log(`###########${Object.keys(x).map(key => `[${key}:${JSON.stringify(x[key])}]`).join('-')}`))
      .map(result => {
        return {
          found: result.lastErrorObject.n > 0,
          closed: result.value ? !result.value.open : false,
          clearing: result.value,
        };
      })
  }

}

/**
 * Returns a ClearingDA
 * @returns {ClearingDA}
 */
module.exports = ClearingDA;
