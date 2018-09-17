// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

//LIBS FOR TESTING
const MongoDB = require('../../bin/data/MongoDB').MongoDB;
const TransactionsDA = require('../../bin/data/TransactionsDA');

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

describe('TransactionsDA', function () {

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
            it('instance TransactionsDA', function (done) {
                TransactionsDA.start$(mongo)
                    .subscribe(
                        (evt) => console.log(`TransactionsDA Start: ${evt}`),
                        (error) => {
                            console.error(`TransactionsDA Start failed: ${error}`);
                            return done(error);
                        },
                        () => { return done(); }
                    );
            });
    });


    /*
    * TESTS
    */

    describe('getTransactions$', function () {
        let dummyData = [];
        it('on empty collection', function (done) {
            let evtArrived = false;
            TransactionsDA.getTransactions$(undefined, Date.now())
                .subscribe(
                    (result) => {
                        evtArrived = true;
                    },
                    (error) => {
                        console.error(`failed: ${error}`);
                        return done(error);
                    },
                    () => {
                        assert.equal(evtArrived, false);
                        return done();
                    }
                );

        });
        it('fill dummy data', function (done) {
            Rx.Observable.range(-50, 100)
                .map(id => {
                    return {
                        "_id": `${id}`,
                        "fromBu": `bu-from-id-${id}`,
                        "toBu": `bu-to-id-${id}`,
                        "amount": (50 + id) * 500,
                        "channel": {
                            "id": "ACSS_CHANNEL_AFCC_RELOAD",
                            "v": '1.2.3',
                            "c": 1
                        },
                        "timestamp": Date.now() + (id * 100),
                        "type": "AFCC_RELOADED",
                        "evt": {
                            "id": "0.6454770488765262",
                            "type": 'et',
                            "user": 'u'
                        }
                    };
                })
                .toArray()
                .do(array => dummyData = array)
                .mergeMap(array => TransactionsDA.createTransactions$(array))
                .do(createdIds => assert.equal(createdIds.length, dummyData.length))
                .subscribe(
                    () => { },
                    (err) => { return done(err) },
                    () => { return done() }
                );
        });
        it('get data with no cursor', function (done) {
            const timestamp = Date.now();
            const pastData = dummyData.filter(d => d.timestamp <= timestamp);
            TransactionsDA.getTransactions$(undefined, timestamp)
                .toArray()
                .first()
                .do(result => assert.deepEqual(result, pastData))
                .subscribe(
                    () => { },
                    (err) => { return done(err) },
                    () => { return done() }
                );
        });

        it('get data with cursor', function (done) {
            const cursor = { transcationId: dummyData[25]._id, timestamp: dummyData[25].timestamp }
            const timestamp = Date.now();
            const pastData = dummyData.filter(d => d.timestamp > cursor.timestamp && d.timestamp <= timestamp);
            TransactionsDA.getTransactions$(cursor, timestamp)
                .toArray()
                .first()
                .do(result => assert.deepEqual(result, pastData))
                .subscribe(
                    () => { },
                    (err) => { return done(err) },
                    () => { return done() }
                );
        });
    });


    /*
    * DE-PREAPARE
    */

    describe('de-prepare test DB', function () {
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
