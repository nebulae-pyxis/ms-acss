// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const expect = require('chai').expect;

//LIBS FOR TESTING
const MongoDB = require('../../bin/data/MongoDB').MongoDB;
const AccumulatedTransactionDA = require('../../bin/data/AccumulatedTransactionDA');
const ObjectID = require('mongodb').ObjectID;

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

describe('AccumulatedTransactionDA', function () {

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
            it('instance AccumulatedTransactionDA', function (done) {
                AccumulatedTransactionDA.start$(mongo)
                    .subscribe(
                        (evt) => console.log(`AccumulatedTransactionDA Start: ${evt}`),
                        (error) => {
                            console.error(`AccumulatedTransactionDA Start failed: ${error}`);
                            return done(error);
                        },
                        () => { return done(); }
                    );
            });
    });


    /*
    * TESTS
    */

    describe('createAccumulatedTransactions$', function () {
        const fromId = ObjectID.createFromHexString('5ba40f2aadb8cf1138aac25d');
        const toId = ObjectID.createFromHexString('5ba40f2aadb8cf1138aac25f');
        let dummyData = [
            { "fromBu": fromId, "toBu":  toId, "amount": 8900, "timestamp": 1537213573008, "transactionIds": { "AFCC_RELOADED": ["A_B_100", "A_B_1000", "B_A_10000"] } }
        ];
        it('insert one accumulated transactions', function (done) {
            AccumulatedTransactionDA.generateAccumulatedTransactionsStatement$(dummyData)
                .toArray()
                .mergeMap(statements => mongo.createCollection$('AccumulatedTransactions').mapTo(statements))
                .mergeMap(statements => {
                    return mongo.applyAll$(statements);
                })
                //.do(statment => console.log(`Apply: ${JSON.stringify(statment, null, 1)}`))
                .map(([txs, txResult]) => Object.values(txs[0].insertedIds))
                .do(atIds => expect(atIds).to.have.length(dummyData.length))
                .mergeMap(atIds => Rx.Observable.from(atIds))
                .mergeMap(atId => AccumulatedTransactionDA.getAccumulatedTransaction$(atId.toString()))
                .map(persistedAt => [persistedAt, dummyData.filter(at => at.fromBu.toHexString() == persistedAt.fromBu && at.timestamp == persistedAt.timestamp).pop()])
                .do( ([persistedAt, dummyAt]) => {
                    dummyAt._id = persistedAt._id;
                    expect(persistedAt).to.be.deep.equals(dummyAt);
                })
                .first()
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
