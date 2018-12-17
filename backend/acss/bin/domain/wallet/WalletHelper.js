const WalletDA = require('../../data/WalletDA');
const SpendingRulesDA = require('../../data/SpendingRulesDA');
const WalletTransactionDA = require('../../data/WalletTransactionDA');
const { mergeMap, reduce, tap, map } = require('rxjs/operators');
const  { of, from, forkJoin } = require('rxjs');
const eventSourcing = require("../../tools/EventSourcing")();
const Event = require("@nebulae/event-store").Event;

class WalletHelper {

  constructor() { }

 /**
   * Save the transactions in the transaction history collection
   * @param {*} event 
   */
  static saveTransactions$(walletTransactionExecuted){
    return of(walletTransactionExecuted)
    .pipe(
      //Processes each transaction one by one
      mergeMap(event => from(event.data.transactions)),
      // Persist transaction
      mergeMap(transaction => {
        const transactionData = {
          _id: transaction.id,
          timestamp: walletTransactionExecuted.timestamp,
          businessId: walletTransactionExecuted.data.businessId,
          type: walletTransactionExecuted.data.transactionType,
          concept: walletTransactionExecuted.data.transactionConcept,
          pocket: transaction.pocket,
          value: transaction.value,
          user: transaction.user,
          associatedTransactionIds: transaction.associatedTransactionIds
        };

        if (transaction.terminal) {
          transactionData.terminal = {
            id: transaction.terminal.id,
            userId: transaction.terminal.userId,
            username: transaction.terminal.username,
          };
        }

        if (transaction.location) {
          transactionData.location = transaction.location;
        }

        if (transaction.notes) {
          transactionData.notes = transaction.notes;
        }

        // console.log('transactionData => ', transactionData);

        return WalletTransactionDA.saveTransactionHistory$(transactionData)
      })
    );
  }

  /**
   * Updates the value of the pockets according to the received transactions
   * @param {*} walletTransactionExecuted 
   * @param {*} business Business info
   * @returns {Observable}
   */
  static applyTransactionsOnWallet$(walletTransactionExecuted, business){
    return of(walletTransactionExecuted)
    .pipe(
      //Processes each transaction one by one
      mergeMap(event => from(event.data.transactions)),
      //Calculates the increment value from main and bonus pockets
      reduce((acc, transaction) => {
        if(transaction.pocket.toUpperCase() == 'MAIN'){
          acc.main += transaction.value;
        }else if(transaction.pocket.toUpperCase() == 'BONUS'){
          acc.bonus += transaction.value;
        }else{
          throw new Error(`Invalid pocket: ${transaction.pocket}`);
        }
        return acc;
      }, {main: 0, bonus: 0}),
      //Update wallet values
      mergeMap(increment => WalletDA.updateWalletPockets$(business, increment))
    );
  }

  /**
   * Checks if an alarm must be generated taking into account the wallet and 
   * the spending rules associated with the indicated business.
   * @param {*} businessId ID of Business that will be checked
   * @return {Observable}
   */
  static checkWalletSpendingAlarms$(businessId){
    return of(businessId)
    .pipe(
      mergeMap(businessId => forkJoin(
        WalletDA.getWallet$(businessId),
        SpendingRulesDA.getSpendingRule$(businessId)
      )),
      mergeMap(([wallet, spendingRule]) => {
        // console.log('checkWalletSpendingAlarms => ', JSON.stringify([wallet, spendingRule]));
        const debt = (wallet.pockets.main || 0) + (wallet.pockets.bonus || 0);

        if (debt <= spendingRule.minOperationAmount && wallet.spendingState == 'ALLOWED') {
          return this.changeWalletSpendingState$(wallet.businessId, 'FORBIDDEN');
        } else if (debt > spendingRule.minOperationAmount && wallet.spendingState == 'FORBIDDEN') {
          return this.changeWalletSpendingState$(wallet.businessId, 'ALLOWED');
        }else{
          return of(null);
        }
      })
    )
  }

  /**
   * Changes the spending state in the wallet and emits an alarm (FORBIDDEN, ALLOWED)
   * 
   * @param {*} businessId ID of the Business to which the wallet will be updated
   * @param {*} newSpendingState New spending state that will be applied to the wallet of the business
   * @return {Observable}
   */
  static changeWalletSpendingState$(businessId, newSpendingState){
    return of({businessId, newSpendingState})
    .pipe(
      //Updates the wallet spending state
      mergeMap(({businessId, newSpendingState}) => WalletDA.updateWalletSpendingState$(businessId, newSpendingState)),
      //Takes the updated wallet data
      //map(updateOperation => updateOperation.value),
      //Throws a wallet spending alarm according to the business spending state
      mergeMap(wallet => this.throwAlarm$(wallet))
    );
  }


  /**
   * Throws a wallet spending alarm according to the wallet spending state. 
   * @param {*} walletData Wallet to check
   */
  static throwAlarm$(walletData){
    return of(walletData)
    .pipe(
      //Emits the wallet spending alarm
      mergeMap(wallet => {
        const eventType = wallet.spendingState == 'FORBIDDEN' ? 'WalletSpendingForbidden': 'WalletSpendingAllowed';

        const alarm = {
          businessId: wallet.businessId,
          wallet: {
            main: wallet.pockets.main,
            bonus: wallet.pockets.bonus
          }
        };

        return eventSourcing.eventStore.emitEvent$(
          new Event({
            eventType,
            eventTypeVersion: 1,
            aggregateType: "Wallet",
            aggregateId: wallet._id,
            data: alarm,
            user: 'SYSTEM'
          })
        );
      })
    )    
  }


}

/**
 * Wallet helpers
 * @returns {WalletHelper}
 */
module.exports = WalletHelper;
