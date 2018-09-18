// // TEST LIBS
// const assert = require("assert");
// const Rx = require("rxjs");
// const uuid = require("uuid/v4");

// //LIBS FOR TESTING
// const transactionAccumulatedEventConsumer = require("../../bin/domain/TransactionAccumulatedEventConsumer")();
// const ClearingDA = require("../../bin/data/ClearingDA");
// const MongoDB = require("../../bin/data/MongoDB").MongoDB;

// //GLOABAL VARS to use between tests
// let mongoDB;
// let businessUuid;
// let transactionAccumulatedEvent;

// /*
// NOTES:
// before run please start docker-compose:
//   cd deployment/compose/
//   docker-compose up
// */

// describe("Transaction accumulated event", function() {
//   describe("Prepare Environment", function() {
//     it("instance MongoDB client", done => {
//       const dbUuid = uuid();
//       console.log("DB UUID ==> ", dbUuid);

//       mongoDB = new MongoDB({
//         url: "mongodb://localhost:27017",
//         dbName: `TEST_${dbUuid}`
//       });
//       mongoDB
//         .start$()
//         .mergeMap(() => ClearingDA.start$(mongoDB))
//         .subscribe(
//           evt => console.log(`MongoDB start: ${evt}`),
//           error => {
//             console.error(`MongoDB start: ${error}`);
//             return done(error);
//           },
//           () => {
//             console.error(`MongoDB start completed`);
//             return done();
//           }
//         );
//     });
//   });

//   describe("Receives accumulated transactions event", function() {
//     it("Process each accumulated transaction", function(done) {
//         transactionAccumulatedEvent = {
//             _id: 1,
//             fromBu: '1a',
//             toBu: '2b',
//             amount: 25000,            
//         }

//         transactionAccumulatedEventConsumer
//         .generateClearingOperations$(transactionAccumulatedEvent)
//         .toArray()
//         .subscribe(mongoOperations => {
//             assert.equal(mongoOperations.length, 2, "Mongo operations");

//             const firstOperation = {
//                 collection: "Clearing",
//                 operation: "updateOne",
//                 operationArgs: [
//                   { businessId: '1a' },
//                   {
//                     $inc: { 'output.1a.amount': 25000 },
//                     $set: { lastUpdateTimestamp: '' },
//                     $push: { accumulatedTransactions: 1},
//                     $setOnInsert: {
//                       timestamp: '',
//                       businessId: '1a'
//                     }
//                   },
//                   { $upsert: true }
//                 ]
//               };

//               const secondOperation = {
//                 collection: "Clearing",
//                 operation: "updateOne",
//                 operationArgs: [
//                   { businessId: '2b' },
//                   {
//                     $inc: { 'input.2b.amount': 25000 },
//                     $set: { lastUpdateTimestamp: '' },
//                     $push: { accumulatedTransactions: 1},
//                     $setOnInsert: {
//                       timestamp: '',
//                       businessId: '2b'
//                     }
//                   },
//                   { $upsert: true }
//                 ]
//               };

//               mongoOperations[0].operationArgs[1]['$set'] = { lastUpdateTimestamp: '' };
//               mongoOperations[1].operationArgs[1]['$set'] = { lastUpdateTimestamp: '' };
//               mongoOperations[0].operationArgs[1]['$setOnInsert']['timestamp'] = '';
//               mongoOperations[1].operationArgs[1]['$setOnInsert']['timestamp'] = '';

//             assert.deepEqual(firstOperation, mongoOperations[0], "Mongo operations");

//             assert.deepEqual(secondOperation, mongoOperations[1], "Mongo operations");   

//             console.log('Mongo operations => ', JSON.stringify(mongoOperations));
//         },
//         error => {
//           console.error(`Error generating Mongo operations: ${error}`);
//           return done(error);
//         },
//         () => {
//           return done();
//         });
//     });
//   });

//   describe("de-prepare Envrionment", function() {
//     it("stop Mongo", function(done) {
//       mongoDB.stop$().subscribe(
//         evt => console.log(`MongoDB stop: ${evt}`),
//         error => {
//           console.error(`MongoDB stop: ${error}`);
//           return done(false);
//         },
//         () => {
//           console.error(`MongoDB stop completed`);
//           return done();
//         }
//       );
//     });
//   });
// });
