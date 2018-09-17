const Rx = require('rxjs');
const broker = require('../tools/broker/BrokerFactory')();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const TransactionsCursorDA = require('../data/TransactionsCursorDA');
const TransactionsDA = require('../data/TransactionsDA');

let instance;

class ClearingJobTriggeredEventHandler {

    constructor() {

    }

    /**
     * Handles the clearingJobTriggeredEvent
     * @param {ClearingJobTriggeredEvent} clearingJobTriggeredEvent 
     */
    handleClearingJobTriggeredEvent$(clearingJobTriggeredEvent) {
        // return TransactionsCursorDA.getCursor$()
        //     .map(cursor => TransactionsDA.getTransactions$(cursor, Date.now() - 5000))
        //     .mergeMap(transactions$ => this.accumulateTransactions$(transactions$))
        //     .map(at => TransactionsDA.createInsert)
        //     .toArray()
        //     .map(ats => {
        //         return {

        //         };
        //     })
    }

    /**
     * Process a stream of transactions and generates an accumulative set of transactions
     * @param {transactions} transactions stream
     * @returns {Rx.Observable} stream of  AccumulatedTransactions
     */
    accumulateTransactions$(transactions$) {
        return transactions$
            .map(t => {  // build group key and values
                t.groupKey = [t.fromBu, t.toBu].sort().join('-');
                t.groupAmount = t.fromBu === t.groupKey.split('-')[0] ? t.amount : (-1 * t.amount);
                return t;
            })
            .groupBy(t => t.groupKey)
            .mergeMap((group$) =>
                group$.reduce((acc, transaction) => {
                    acc.amount += transaction.groupAmount;
                    if (!acc.transactionIds[transaction.type]) {
                        acc.transactionIds[transaction.type] = [];
                    }
                    acc.transactionIds[transaction.type].push(transaction._id);
                    return acc;
                }, {
                        fromBu: group$.key.split('-')[0],
                        toBu: group$.key.split('-')[1],
                        amount: 0,
                        timestamp: Date.now(),
                        transactionIds: {}
                    })
            ).map(at => {
                if (at.amount < 0) {
                    const fromBu = at.fromBu;
                    at.fromBu = at.toBu;
                    at.toBu = fromBu;
                    at.amount = (-1 * at.amount);
                }
                return at;
            });
    }

}

/**
 * Transaction accumulated event consumer
 * @returns {ClearingJobTriggeredEventHandler} ClearingJobTriggeredEventHandler
 */
module.exports =
    () => {
        if (!instance) {
            instance = new ClearingJobTriggeredEventHandler();
            console.log('ClearingJobTriggeredEventHandler Singleton created');
        }
        return instance;
    };