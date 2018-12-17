const BusinessDA = require("../../data/BusinessDA");
const LogErrorDA = require("../../data/LogErrorDA");
const TransactionsDA = require('../../data/TransactionsDA');
const broker = require('../../tools/broker/BrokerFactory')();
// const { mergeMap, catchError, map, defaultIfEmpty, first, tap, filter, toArray, groupBy, debounceTime} = require('rxjs/operators');
// const  { of } = require('rxjs');
const Rx = require("rxjs");
const uuidv4 = require("uuid/v4");
const eventSourcing = require("../../tools/EventSourcing")();
const Event = require("@nebulae/event-store").Event;
const mongoDB = require('../../data/MongoDB').singleton();

const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

let instance;

class WalletES {
  constructor() {
  }


  /**
   * Create a transaction between the balance adjustment business unit 
   * and the platform business unit. this transaction indicates the amount of 
   * money that has been deposited or withdrawal.
   * @param {*} walletTransactionExecuted 
   */
  handleWalletTransactionExecuted$(walletTransactionExecuted){
    console.log('handleWalletTransactionExecuted => ', JSON.stringify(walletTransactionExecuted));
    return Rx.Observable.of(walletTransactionExecuted.data)
    .filter(event => event.transactionType == 'MOVEMENT' && (event.transactionConcept == 'WITHDRAWAL' || event.transactionConcept == 'DEPOSIT'))
    .mergeMap(walletTransactionExecuted => Rx.Observable.from(walletTransactionExecuted.transactions))
    .map(transaction => {
      const isDeposit = walletTransactionExecuted.data.transactionConcept == 'DEPOSIT'
      return {          
        fromBu: isDeposit ? process.env.BALANCE_ADJUSTMENT_BUSINESS_ID: process.env.BUSINESS_PLATFORM_ID,
        toBu: isDeposit ? process.env.BUSINESS_PLATFORM_ID: process.env.BALANCE_ADJUSTMENT_BUSINESS_ID,
        amount: transaction.value,
        // channel: {
        //   id: CHANNEL_ID,
        //   v: process.env.npm_package_version,
        //   c: conf.lastEdition
        // },
        timestamp: Date.now(),
        type: walletTransactionExecuted.data.transactionType,
        evt: {
          id: walletTransactionExecuted._id, 
          type: walletTransactionExecuted.et, 
          user: walletTransactionExecuted.user 
        }
      };
    })
    .mergeMap(data => {
      console.log('Data => ', data)
      return TransactionsDA.createTransaction$(data);
    });  
  }



  /**
   * Handles and persist the errors generated.
   * @param {*} error Error stack   
   * @param {*} event settlementJobTriggered event
   * @param {*} errorType Error type (walletTransactionExecuted, walletDepositCommitedEvent, ...)
   */
  errorHandler$(event, error, errorType) {
    return of({ error, type: errorType, event }).pipe(
      mergeMap(log =>
        LogErrorDA.persistLogError$(log)
      )
    );
  }
}

/**
 * Wallet ES consumer
 * @returns {WalletES}
 */
module.exports = () => {
  if (!instance) {
    instance = new WalletES();
    console.log("WalletES Singleton created");
  }
  return instance;
};
