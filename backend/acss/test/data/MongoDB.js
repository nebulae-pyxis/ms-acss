// TEST LIBS
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const expect = require('chai').expect;
const assert = require('assert');

//LIBS FOR TESTING
const MongoDB = require('../../bin/data/MongoDB').MongoDB;

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

describe('MongoDB', function () {

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
        })
    });

    /*
    * TESTS
    */

   describe('Apply multiple operations in an transactional environment$', function () {
    it('Apply all', function (done) {
        const collectionName = "operations";
        const collectionVsOperationCommand = [
            {
                collection: collectionName,
                operation: "insertOne",
                operationArgs: [{ name: "operation1", timestamp: new Date().getTime(), state: true }]
            },
            {
                collection: collectionName,
                operation: "updateOne",
                operationArgs: [{ name: "operation1"}, { $set: {state: false} }]
            },
            {
                collection: collectionName,
                operation: "insertMany",
                operationArgs: [
                    [
                        { name: "operation2", timestamp: new Date().getTime(), state: true }, 
                        { name: "operation3", timestamp: new Date().getTime(), state: false }
                    ]
                ]
            },
        ];

        

        Rx.Observable.defer(()=>
            mongo.createCollection$(collectionName)
        )
            .mergeMap(res => mongo.applyAll$(collectionVsOperationCommand))
            //.do(res => console.log('AppliAll ================> ', JSON.stringify(res)))
            .mergeMap(() => Rx.Observable.defer(() => mongo.db.collection(collectionName).find({}).toArray()))
            .subscribe(
                (data) => { 
                    console.log('MONGO DATA => ', data);
                    const firstData = data[0];
                    delete firstData._id;

                    const secondData = data[1];
                    delete secondData._id;

                    const thirdData = data[2];
                    delete thirdData._id;
                    
                    assert.deepEqual(firstData, { name: "operation1", timestamp: collectionVsOperationCommand[0].operationArgs[0].timestamp, state: false }, "The data does not match");

                    assert.deepEqual(secondData, { name: "operation2", timestamp: collectionVsOperationCommand[2].operationArgs[0][0].timestamp, state: true }, "The data does not match");

                    assert.deepEqual(thirdData, { name: "operation3", timestamp: collectionVsOperationCommand[2].operationArgs[0][1].timestamp, state: false }, "The data does not match");
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
    * TESTS
    */

    describe('moveDocumentToOtherCollectionsStatements$', function () {
        it('move document', function (done) {
            const fromCollectionName = "SOURCE";
            const toCollectionName = "DEST";
            const document = { a: 1, b: 2, c: 3, _id: uuidv4() };

            Rx.Observable.forkJoin(
                Rx.Observable.defer(() => mongo.db.collection(fromCollectionName).insertOne(document)),
                mongo.createCollection$(toCollectionName)
            )
                .switchMapTo(mongo.moveDocumentToOtherCollectionsStatements$(fromCollectionName, toCollectionName, document._id))
                .mergeMap(() =>
                    Rx.Observable.forkJoin(
                        Rx.Observable.defer(() => mongo.db.collection(fromCollectionName).findOne({ _id: document._id })),
                        Rx.Observable.defer(() => mongo.db.collection(toCollectionName).findOne({ _id: document._id }))
                    ))
                .first()
                .do(([originalDoc, newDoc]) => {
                    expect(originalDoc).to.be.null;
                    expect(newDoc).to.be.deep.equals(document);
                })
                .subscribe(
                    (evt) => { },
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
