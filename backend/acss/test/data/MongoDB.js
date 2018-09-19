// TEST LIBS
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const expect = require('chai').expect;

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
