"use strict";

const Rx = require("rxjs");
const MongoClient = require("mongodb").MongoClient;
const CollectionName = "Business";
let instance = null;

class MongoDB {
  /**
   * initialize and configure Mongo DB
   * @param { { url, dbName } } ops
   */
  constructor({ url, dbName }) {
    this.url = url;
    this.dbName = dbName;
  }

  /**
   * Starts DB connections
   * @returns {Rx.Observable} Obserable that resolve to the DB client
   */
  start$() {
    console.log("MongoDB.start$()... ");
    return Rx.Observable.bindNodeCallback(MongoClient.connect)(this.url).map(
      client => {
        console.log(this.url);
        this.client = client;
        this.db = this.client.db(this.dbName);
        return `MongoDB connected to dbName= ${this.dbName}`;
      }
    );
  }

  /**
   * Returns an observable that takes an array of operations (insert, updateOne, ...)
   * an executes each one on Mongo in a transactional environment.
   * If an error ocurs the transaction will be aborted and all of the operations will be ignored.
   *
   * Note: Mongo transactions only work with Mongo Replicaset and operations 
   * such as creating or dropping a collections or an index are not allowed.
   *
   * @param collectionVsOperationAndCommand array of collections vs operations
   * @param collectionVsOperationAndCommand.collection Collection name where the operation will be applied
   * @param collectionVsOperationAndCommand.operation indicates which operation will be executed (E.g insert, updateOne, ...)
   * @param collectionVsOperationAndCommand.operationArgs Array that indicates the values that will be passed as arguments of the operation to execute.
   * @param {collectionVsOperationAndCommand.operationOps} [collectionVsOperationAndCommand.operationOps] - indicates the options that will be passed as arguments of the operation to execute.
   * 
   * @example
   * const collectionVsOperationAndCommand = [
        {
            collection: "collectionName1",
            operation: "insertOne",
            operationArgs: [{ name: "John", lastname: 'Doe', state: true }]
        },
        {
            collection: "collectionName2",
            operation: "updateOne",
            operationArgs: [{ name: "John"}, { $set: {name: 'John Doe'} }],
            operationOps: {},
        }
      ];
   * @returns {Observable} An observable that executes the Mongo operations
   */
  applyAll$(collectionVsOperationAndCommand) {
    //Starts Mongo session
    return (
      Rx.Observable.defer(() => Rx.Observable.of(this.client.startSession()))
        //Starts Mongo transaction
        .mergeMap(session => {
          session.startTransaction(); 
          return Rx.Observable.of(session);
        }) 
        .mergeMap(session => {
          return (
            Rx.Observable.of(session)
              .mergeMap(tx => {
                //Executes each operation on Mongo
                return (
                  Rx.Observable.from(collectionVsOperationAndCommand)
                    .concatMap(data => {
                      //To execute all of the operations into a transactionsal environment, we must pass the session to each operation
                      data.operationOps =
                        data.operationOps == null
                          ? { session }
                          : { ...data.operationOps, session };
                      return this.db
                        .collection(data.collection)
                        [data.operation](
                          ...data.operationArgs,
                          data.operationOps
                        );
                    })
                    .toArray()
                );
              })
              //Commits Mongo transaction
              .mergeMap(txs => session.commitTransaction())
              //Ends Mongo session
              .mergeMap(txResult =>
                Rx.Observable.bindNodeCallback(session.endSession)
              )
              //If an error ocurred, the transaction is aborted
              .catch(err => {
                console.log("Error TX: ", err);
                return Rx.Observable.of(err)
                  .mergeMap(error => session.abortTransaction())
                  .mergeMap(txResult =>
                    Rx.Observable.bindNodeCallback(session.endSession)
                  )
                  .mergeMap(error => Rx.Observable.throw(err)); // Rethrow so calling function sees error);
              })
          );
        })
    );
  }

  /**
   * Stops DB connections
   * Returns an Obserable that resolve to a string log
   */
  stop$() {
    return Rx.Observable.create(observer => {
      this.client.close();
      observer.next("Mongo DB Client closed");
      observer.complete();
    });
  }

  /**
   * Ensure Index creation
   * Returns an Obserable that resolve to a string log
   */
  createIndexes$() {
    return Rx.Observable.create(async observer => {
      //observer.next('Creating index for DB_NAME.COLLECTION_NAME => ({ xxxx: 1 })  ');
      //await this.db.collection('COLLECTION_NAME').createIndex( { xxxx: 1});

      observer.next("All indexes created");
      observer.complete();
    });
  }


    /**
     * extracts every item in the mongo cursor, one by one
     * @param {*} cursor 
     */
    static extractAllFromMongoCursor$(cursor) {
      return Rx.Observable.create(async observer => {
          let obj = await MongoDB.extractNextFromMongoCursor(cursor);
          while (obj) {
              observer.next(obj);
              obj = await MongoDB.extractNextFromMongoCursor(cursor);
          }
          observer.complete();
      });
  }

  /**
   * Extracts the next value from a mongo cursos if available, returns undefined otherwise
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




module.exports = {
  /**
   * Mongo class
   * @return {MongoDB}
   */
  MongoDB,
  /**
   * Gets the singleton instance of Mongo
   * @return {MongoDB} The mongoDB instance
   */
  singleton() {
    if (!instance) {
      instance = new MongoDB({
        url: process.env.MONGODB_URL,
        dbName: process.env.MONGODB_DB_NAME
      });
      console.log(`MongoDB instance created: ${process.env.MONGODB_DB_NAME}`);
    }
    return instance;
  }
};
