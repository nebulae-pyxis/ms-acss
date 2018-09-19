// TEST LIBS
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const expect = require('chai').expect;

//LIBS FOR TESTING
const MongoDB = require('../../bin/data/MongoDB').MongoDB;
const SettlementDA = require('../../bin/data/SettlementDA');

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

describe('SettlementDA', function () {

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
            it('instance SettlementDA', function (done) {
                SettlementDA.start$(mongo)
                    .subscribe(
                        (evt) => console.log(`SettlementDA Start: ${evt}`),
                        (error) => {
                            console.error(`SettlementDA Start failed: ${error}`);
                            return done(error);
                        },
                        () => { return done(); }
                    );
            });
    });


    /*
    * TESTS
    */

    describe('generate and persists Settlements', function () {
        let dummyData = [
            {_id:uuidv4(), fromBu:'1', toBu:'a', amount:1},
            {_id:uuidv4(), fromBu:'2', toBu:'b', amount:2},
            {_id:uuidv4(), fromBu:'3', toBu:'c', amount:3},
            {_id:uuidv4(), fromBu:'4', toBu:'d', amount:4},
            {_id:uuidv4(), fromBu:'5', toBu:'e', amount:5},
        ];
        it('insert multiple settlements', function (done) {
            SettlementDA.generateSettlementInsertStatement$(dummyData)
                .toArray()
                .mergeMap(statements => mongo.createCollection$('Settlements').mapTo(statements))
                .mergeMap(statements => mongo.applyAll$(statements))
                //.do(statment => console.log(`Apply: ${JSON.stringify(statment, null, 1)}`))
                .map(([txs, txResult]) => Object.values(txs[0].insertedIds))
                .do(settIds => expect(settIds).to.have.length(dummyData.length))
                .mergeMap(settIds => Rx.Observable.from(settIds))
                .mergeMap(settId => SettlementDA.getSettlement$(settId))
                .map(persistedSettlement => [persistedSettlement, dummyData.filter(sett => sett.fromBu == persistedSettlement.fromBu && sett.amount == persistedSettlement.amount).pop()])
                .do( ([persistedSettlement, dummySett]) => {
                    dummySett._id = persistedSettlement._id;
                    expect(persistedSettlement).to.be.deep.equals(dummySett);
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
