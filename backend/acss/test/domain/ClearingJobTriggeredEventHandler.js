// // TEST LIBS
// const assert = require('assert');
// const Rx = require('rxjs');
// const uuidv4 = require('uuid/v4');
// const should = require('chai').should();
// const expect = require('chai').expect;

// //LIBS FOR TESTING
// const clearingJobTriggeredEventHandler = require('../../bin/domain/ClearingJobTriggeredEventHandler')();

// //
// let mongo = undefined;
// const basicTx = {
//     "channel": {
//         "id": "ACSS_CHANNEL_AFCC_RELOAD",
//         "v": '1.2.3',
//         "c": 1
//     },
//     "timestamp": Date.now(),
//     "type": "AFCC_RELOADED",
//     "evt": {
//         "id": "0.6454770488765262",
//         "type": 'et',
//         "user": 'u'
//     }
// };


// describe('ClearingJobTriggeredEventHandler', function () {

//     /*
//     * PREAPARE
//     */

//     describe('Prepare test ', function () {
//         it('Create data sets', function (done) {
//             done();
//         })
//     });


//     /*
//     * TESTS
//     */

//     describe('accumulateTransactions$', function () {
//         let dummyData = [];
//         it('1 to 1 basics txs', function (done) {
//             const txs = [
//                 {
//                     _id: "A_B",
//                     fromBu: "A",
//                     toBu: "B",
//                     amount: 100,
//                     ...basicTx
//                 },
//                 {
//                     _id: "B_C",
//                     fromBu: "B",
//                     toBu: "C",
//                     amount: 200,
//                     ...basicTx
//                 },
//                 {
//                     _id: "C_D",
//                     fromBu: "C",
//                     toBu: "D",
//                     amount: 300,
//                     ...basicTx
//                 },
//             ];
//             clearingJobTriggeredEventHandler.accumulateTransactions$(Rx.Observable.from(txs))
//                 //.do(at => console.log(`Accumulated Transaction = ${JSON.stringify(at)}`))
//                 .toArray()
//                 .do(accumulatedTransactions => {
//                     accumulatedTransactions.should.have.lengthOf(txs.length);
//                     accumulatedTransactions.forEach(at => {
//                         tx = txs.filter(t => t.fromBu == at.fromBu && t.toBu == at.toBu && t.amount == at.amount);
//                         tx.should.have.lengthOf(1);
//                         tx = tx.pop();
//                         at.transactionIds[tx.type].should.have.lengthOf(1);
//                         expect(at.transactionIds[tx.type][0]).to.be.equal(tx._id);
//                     });
//                 })
//                 .first()
//                 .subscribe(
//                     () => { },
//                     (err) => done(err),
//                     () => done()
//                 );

//         });
//         it('3 to 1 basic txt', function (done) {
//             const txs = [
//                 {
//                     _id: "B_A_10000",
//                     fromBu: "B",
//                     toBu: "A",
//                     amount: 10000,
//                     ...basicTx
//                 },
//                 {
//                     _id: "A_B_100",
//                     fromBu: "A",
//                     toBu: "B",
//                     amount: 100,
//                     ...basicTx
//                 },
//                 {
//                     _id: "A_B_1000",
//                     fromBu: "A",
//                     toBu: "B",
//                     amount: 1000,
//                     ...basicTx
//                 },
                
//             ];
//             clearingJobTriggeredEventHandler.accumulateTransactions$(Rx.Observable.from(txs))
//                 //.do(at => console.log(`Accumulated Transaction = ${JSON.stringify(at)}`))
//                 .toArray()
//                 .do(accumulatedTransactions => {
//                     accumulatedTransactions.should.have.lengthOf(1);
//                     atx = accumulatedTransactions.pop();
//                     expect(atx.fromBu).to.be.equal("B");
//                     expect(atx.toBu).to.be.equal("A");
//                     expect(atx.amount).to.be.equal(8900);
//                     expect(atx.transactionIds.AFCC_RELOADED).to.have.lengthOf(txs.length);
//                     expect(atx.transactionIds.AFCC_RELOADED).to.be.deep.equal(txs.map(t => t._id));
//                 })
//                 .first()
//                 .subscribe(
//                     () => { },
//                     (err) => done(err),
//                     () => done()
//                 );
//         });

//     });


//     /*
//     * DE-PREAPARE
//     */

//     describe('de-prepare test', function () {
//         it('deprapare', function (done) {
//             done();
//         });
//     });
// });
