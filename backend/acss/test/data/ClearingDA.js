// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const expect = require('chai').expect;

//LIBS FOR TESTING
const MongoDB = require('../../bin/data/MongoDB').MongoDB;
const ClearingDA = require('../../bin/data/ClearingDA');
const accumulatedTransactionEventConsumer = require("../../bin/domain/AccumulatedTransactionEventConsumer")();

//
let mongo = undefined;


/*
NOTES:
before run please start mongoDB:
  docker-compose up setup-rs

  remember to config /etc/hosts to resolve store-mongo1, store-mongo2, store-mongo3
    127.0.0.1 store-mongo1
    127.0.0.1 store-mongo2
    127.0.0.1 store-mongo3

*/

describe('ClearingDA', function () {

  /*
  * PREAPARE
  */

  describe('Prepare test DB', function () {
    it('instance Mongo', function (done) {
      mongo = new MongoDB({
        url: 'mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs0',
        dbName: `test_${uuidv4()}_acss`
      });
      mongo.start$()
        .subscribe(
          (evt) => console.log(`Mongo Start: ${evt}`),
          (error) => {
            console.error(`Mongo Start failed: ${error}`);
            return done(error);
          },
          () => { return done(); }
        );
    }),
      it('instance ClearingDA', function (done) {
        ClearingDA.start$(mongo)
          .subscribe(
            (evt) => console.log(`ClearingDA Start: ${evt}`),
            (error) => {
              console.error(`ClearingDA Start failed: ${error}`);
              return done(error);
            },
            () => { return done(); }
          );
      });
  });


  /*
  * TESTS
  */


  describe("Receives accumulated transactions event", function () {
    it("Process each accumulated transaction", function (done) {
      transactionAccumulatedEvent = {
        _id: 1,
        fromBu: '1a',
        toBu: '2b',
        amount: 25000,
      }

      accumulatedTransactionEventConsumer
        .generateClearingOperations$(transactionAccumulatedEvent)
        .toArray()
        .subscribe(mongoOperations => {
          assert.equal(mongoOperations.length, 2, "Mongo operations");

          const firstOperation = {
            collection: "Clearing",
            operation: "updateOne",
            operationArgs: [
              { businessId: '1a', open: true },
              {
                $inc: { 'output.2b.amount': 25000 },
                $set: { lastUpdateTimestamp: '' },
                $push: { accumulatedTransactionIds: 1 },
                $setOnInsert: {
                  timestamp: '',
                  businessId: '1a',
                  open: true
                }
              },              
            ],
            "operationOps": { upsert: true }
          };

          const secondOperation = {
            collection: "Clearing",
            operation: "updateOne",
            operationArgs: [
              { businessId: '2b', open: true },
              {
                $inc: { 'input.1a.amount': 25000 },
                $set: { lastUpdateTimestamp: '' },
                $push: { accumulatedTransactionIds: 1 },
                $setOnInsert: {
                  timestamp: '',
                  businessId: '2b',
                  open: true
                }
              },
              
            ],
            "operationOps": { upsert: true }
          };

          mongoOperations[0].operationArgs[1]['$set'] = { lastUpdateTimestamp: '' };
          mongoOperations[1].operationArgs[1]['$set'] = { lastUpdateTimestamp: '' };
          mongoOperations[0].operationArgs[1]['$setOnInsert']['timestamp'] = '';
          mongoOperations[1].operationArgs[1]['$setOnInsert']['timestamp'] = '';

          assert.deepEqual(firstOperation, mongoOperations[0], "Mongo operations");

          assert.deepEqual(secondOperation, mongoOperations[1], "Mongo operations");

          //console.log('Mongo operations => ', JSON.stringify(mongoOperations));
        },
          error => {
            console.error(`Error generating Mongo operations: ${error}`);
            return done(error);
          },
          () => {
            return done();
          });
    });
  });

  describe('closeClearing$', function () {
    it('on no found clearing', function (done) {
      const clearingId = uuidv4();
      ClearingDA.closeClearing$(clearingId)
        .first()
        .subscribe(
          ({ found, closed, clearing }) => {
            expect(found).to.be.equals(false);
            expect(closed).to.be.equals(false);
            expect(clearing).to.be.null;
          },
          (error) => {
            console.error(`failed: ${error}`);
            return done(error);
          },
          () => {
            return done();
          }
        );
    });
    it('on open clearing', function (done) {
      const clearingId = uuidv4();
      const businessId = 1;
      Rx.Observable.defer(() => mongo.db.collection('Clearing').insertOne({ _id: clearingId, businessId, open: true }))
        .switchMapTo(ClearingDA.closeClearing$(businessId))
        .first()
        .subscribe(
          ({ found, closed, clearing }) => {
            expect(found).to.be.equals(true);
            expect(closed).to.be.equals(true);
            expect(clearing).to.not.be.null;
          },
          (error) => {
            console.error(`failed: ${error}`);
            return done(error);
          },
          () => {
            return done();
          }
        );
    });

    it('on found and close clearing', function (done) {
      const clearingId = uuidv4();
      const businessId = 1;
      Rx.Observable.defer(() => mongo.db.collection('Clearing').insertOne({ _id: clearingId, businessId, open: true }))
        .switchMapTo(ClearingDA.closeClearing$(businessId))
        .first()
        .subscribe(
          ({ found, closed, clearing }) => {
            expect(found).to.be.equals(true);
            expect(closed).to.be.equals(true);
            expect(clearing).to.not.be.null;
          },
          (error) => {
            console.error(`failed: ${error}`);
            return done(error);
          },
          () => {
            return done();
          }
        );
    });
  });

  /*
  * DE-PREAPARE
  */

  describe('de-prepare test DB', function () {
    it('delete mongoDB', function (done) {
      mongo.dropDB$()
        .subscribe(
          (evt) => console.log(`${evt}`),
          (error) => {
            console.error(`Mongo DropDB failed: ${error}`);
            return done(error);
          },
          () => { return done(); }
        );
    });
    it('stop mongo', function (done) {
      mongo.stop$()
        .subscribe(
          (evt) => console.log(`Mongo Stop: ${evt}`),
          (error) => {
            console.error(`Mongo Stop failed: ${error}`);
            return done(error);
          },
          () => { return done(); }
        );
    });
  });
});
