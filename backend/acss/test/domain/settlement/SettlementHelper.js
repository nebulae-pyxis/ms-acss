// TEST LIBS
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const expect = require('chai').expect;

//LIBS FOR TESTING
const SettlementHelper = require('../../../bin/domain/settlement/SettlementHelper');

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



});
