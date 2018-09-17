// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

//LIBS FOR TESTING
const MongoDB = require('../../bin/data/MongoDB').MongoDB;
const TransactionsCursorDA = require('../../bin/data/TransactionsCursorDA');

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
                () => {return done();}
            );
        }),
        it('instance TransactionsCursorDA', function (done) {            
            TransactionsCursorDA.start$(mongo)
            .subscribe(
                (evt) => console.log(`TransactionsCursorDA Start: ${evt}`),
                (error) => {
                    console.error(`TransactionsCursorDA Start failed: ${error}`);
                    return done(error);
                },
                () => {return done();}
            );
        });
    });


    /*
    * TESTS
    */

    describe('setCursor$', function () {
        it('on first time', function (done) {
            const cursor = {
                transactionId : 'my-last-transactions',
                timestamp : Date.now()
            };                        
            let evtArrived = false;
            TransactionsCursorDA.setCursor$(cursor)
            .subscribe(
                (result) => {
                    assert.equal(result.updated,false);
                    assert.equal(result.created,true);
                    evtArrived = true;
                },
                (error) => {
                    console.error(`failed: ${error}`);
                    return done(error);
                },
                () => {
                    assert.equal(evtArrived,true);
                    return done();
                }
            );
        });
        it('on update', function (done) {
            const cursor = {
                transactionId : 'my-last-transactions-2',
                timestamp : Date.now()
            };             
            let evtArrived = false;           
            TransactionsCursorDA.setCursor$(cursor)
            .subscribe(
                (result) => {
                    assert.equal(result.updated,true);
                    assert.equal(result.created,false);
                    evtArrived = true;
                },
                (error) => {
                    console.error(`failed: ${error}`);
                    return done(error);
                },
                () => {
                    assert.equal(evtArrived,true);
                    return done();
                }
            );
        });        
    });


    describe('getCursor$', function () {
        it('get cursor', function (done) {                        
            let evtArrived = false;           
            TransactionsCursorDA.getCursor$()
            .subscribe(
                (cursor) => {
                    assert.equal(cursor._id, 'current');
                    assert.equal(cursor.transactionId, 'my-last-transactions-2');
                    evtArrived = true;
                },
                (error) => {
                    console.error(`failed: ${error}`);
                    return done(error);
                },
                () => {
                    assert.equal(evtArrived,true);
                    return done();
                }
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
                () => {return done();}
            );
        });
    });
});
