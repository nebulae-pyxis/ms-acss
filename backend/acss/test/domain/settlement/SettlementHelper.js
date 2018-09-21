// TEST LIBS
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const expect = require('chai').expect;
const MongoDB = require('../../../bin/data/MongoDB').MongoDB;

//LIBS FOR TESTING
const SettlementHelper = require('../../../bin/domain/settlement/SettlementHelper');
const ClearingDA = require('../../../bin/data/ClearingDA');

//
let mongo = undefined;
const clearing = {
    _id: '432423423',
    timestamp: 1537284121501,
    lastUpdateTimestamp: 1537284121501,
    businessId: '5b91826fa90045787d25eb90',
    input: {
        'in1': {
            amount: 1000
        },
        'in2': {
            amount: 2000
        },
        'in3': {
            amount: 3000
        },
        'in4': {
            amount: 4000
        }
    },
    output: {
        'out1': {
            amount: 1001
        },
        'out2': {
            amount: 2002
        },
        'out3': {
            amount: 3003
        },
        'out4': {
            amount: 4004
        }
    },
    accumulatedTransactionIds: [1, 2, 3, 4, 5, 6, 7, 8],
    partialSettlement: {},
};



describe('SettlementHelper', function () {


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
    describe('generateSettlements$', function () {
        it('w/ simple clearing', function (done) {
            SettlementHelper.generateSettlements$(clearing)
                .do(s => expect(s.clearingId).to.be.equals(clearing._id))
                .do(s => {
                    if (s.fromBu === clearing.businessId) {
                        expect(s.amount).to.be.equals(clearing.output[s.toBu].amount);
                    } else {
                        expect(s.amount).to.be.equals(clearing.input[s.fromBu].amount);
                    }
                })
                .toArray()
                .first()
                .do(settlements => expect(settlements).to.be.lengthOf(Object.keys(clearing.input).length + Object.keys(clearing.output).length).length)
                .subscribe(
                    (result) => {
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


    describe('generateCollateralClearingsMods$', function () {
        it('1 main clearing affecting 2 other clearings', function (done) {

            const businessMainId = '5b91826fa90045787d000001';
            const businessAId = '5b91826fa90045787d00000a';
            const businessBId = '5b91826fa90045787d00000b';


            const clearingTemplate = {
                input: {}, output: {}, partialSettlement: { input: [], output: [] }, open: true
            };
            const clearingMain = { input: {}, output: {}, partialSettlement: { input: [], output: [] }, open: true, _id: '5b91826fa90045787d100001', businessId: businessMainId };
            const clearingA = { input: {}, output: {}, partialSettlement: { input: [], output: [] }, open: true, _id: '5b91826fa90045787d10000a', businessId: businessAId };
            const clearingB = { input: {}, output: {}, partialSettlement: { input: [], output: [] }, open: true, _id: '5b91826fa90045787d10000b', businessId: businessBId };

            // A owns Main 100
            clearingA.output[businessMainId] = { amount: 100 };
            clearingMain.input[businessAId] = { amount: 100 };

            // Main owns B 300
            clearingMain.output[businessBId] = { amount: 300 };
            clearingB.input[businessMainId] = { amount: 300 };

            // B owns Main 120
            clearingB.output[businessMainId] = { amount: 120 };
            clearingMain.input[businessBId] = { amount: 120 };

            Rx.Observable.forkJoin(
                Rx.Observable.fromPromise(mongo.db.collection(ClearingDA.openClearingCollectionName).insertOne(clearingMain)),
                Rx.Observable.fromPromise(mongo.db.collection(ClearingDA.openClearingCollectionName).insertOne(clearingA)),
                Rx.Observable.fromPromise(mongo.db.collection(ClearingDA.openClearingCollectionName).insertOne(clearingB))
            ).switchMapTo(SettlementHelper.generateSettlements$(clearingMain)
            ).toArray().mergeMap(settlements => SettlementHelper.generateCollateralClearingsMods$(businessMainId, settlements)
            ).toArray().mergeMap(statements => mongo.applyAll$(statements)
            ).switchMapTo(
                Rx.Observable.forkJoin(
                    Rx.Observable.defer(() => mongo.db.collection(ClearingDA.openClearingCollectionName).findOne({ businessId: businessMainId })),
                    Rx.Observable.defer(() => mongo.db.collection(ClearingDA.openClearingCollectionName).findOne({ businessId: businessAId })),
                    Rx.Observable.defer(() => mongo.db.collection(ClearingDA.openClearingCollectionName).findOne({ businessId: businessBId })),
                )
            ).do(([finalClearingMain, finalClearingA, finalClearingB]) => {
                // Main clearing states the same
                expect(Object.keys(finalClearingMain.input)).to.be.lengthOf(2);
                expect(Object.keys(finalClearingMain.output)).to.be.lengthOf(1);
                expect(finalClearingMain.input[businessAId]).to.be.deep.equals({ amount: 100 });
                expect(finalClearingMain.input[businessBId]).to.be.deep.equals({ amount: 120 });
                expect(finalClearingMain.output[businessBId]).to.be.deep.equals({ amount: 300 });
                expect(finalClearingMain.partialSettlement.output).to.be.lengthOf(0);
                expect(finalClearingMain.partialSettlement.input).to.be.lengthOf(0);

                // A owns nothing to Main
                expect(Object.keys(finalClearingA.output)).to.be.lengthOf(1);
                expect(finalClearingA.output[businessMainId].amount).to.be.equals(0);
                expect(finalClearingA.partialSettlement.output).to.be.lengthOf(1);
                expect(finalClearingA.partialSettlement.output[0].buId).to.be.equals(businessMainId);
                expect(finalClearingA.partialSettlement.output[0].amount).to.be.equals(100);
                expect(finalClearingA.partialSettlement.output[0].amount).to.not.be.null;

                // B owns nothing to Main & Main owns nothing to B
                expect(Object.keys(finalClearingB.output)).to.be.lengthOf(1);
                expect(Object.keys(finalClearingB.input)).to.be.lengthOf(1);
                expect(finalClearingB.output[businessMainId].amount).to.be.equals(0);
                expect(finalClearingB.input[businessMainId].amount).to.be.equals(0);
                expect(finalClearingB.partialSettlement.output).to.be.lengthOf(1);
                expect(finalClearingB.partialSettlement.input).to.be.lengthOf(1);
                expect(finalClearingB.partialSettlement.output[0].buId).to.be.equals(businessMainId);
                expect(finalClearingB.partialSettlement.output[0].amount).to.be.equals(120);
                expect(finalClearingB.partialSettlement.output[0].amount).to.not.be.null;
                expect(finalClearingB.partialSettlement.input[0].buId).to.be.equals(businessMainId);
                expect(finalClearingB.partialSettlement.input[0].amount).to.be.equals(300);
                expect(finalClearingB.partialSettlement.input[0].amount).to.not.be.null;
            }).first()
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
