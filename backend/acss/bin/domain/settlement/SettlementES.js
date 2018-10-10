const Rx = require("rxjs");
const SettlementHelper = require("./SettlementHelper");
const ClearingDA = require("../../data/ClearingDA");
const SettlementDA = require("../../data/SettlementDA");
const LogErrorDA = require('../../data/LogErrorDA');
const mongoDB = require("../../data/MongoDB").singleton();

let instance;

class SettlementES {
  constructor() {
    /**
     * Rx Subject for every message reply
     */
    this.settlementEvent$ = new Rx.Subject();
    this.settlementEventSubscription = undefined;
  }

  start$() {
    return Rx.Observable.create(obs => {
      this.settlementEventSubscription = this.settlementEvent$
        .concatMap(settlement => {
          return this.executeSettlementJobTriggered$(settlement).delay(3000);
        })
        .subscribe(
          evt => {
            console.log(evt);
          },
          error => {
            console.error("Failed processing settlement events", error);
            //process.exit(1);
          },
          () => console.log("Settlement ES completed")
        );
      obs.next("SettlementJobTrigger listener executed");
      obs.complete();
    });
  }

  /**
   * Receives the settlement events and trigger the event to the subject.
   * @param {*} settlementJobTriggered
   */
  handleSettlementJobTriggeredEvent$(settlementJobTriggered) {
    return Rx.Observable.of(settlementJobTriggered).do(settlementJob => {
      this.settlementEvent$.next(settlementJob);
    });
  }

  /**
   * handle the cron job event - handleSettlementJobTriggeredEvent
   *
   * @param {*} settlementJobTriggered cron job event
   * @returns {Rx.Observable}
   */
  executeSettlementJobTriggered$(settlementJobTriggered) {
    return ClearingDA.closeClearing$(settlementJobTriggered.data.businessId)
      .filter(
        ({ found, closed, clearing }) => found && closed && clearing !== null
      )
      .pluck("clearing")
      .map(clearing => {
        //normalizes data structure
        clearing.input = clearing.input || [];
        clearing.output = clearing.output || [];
        clearing.partialSettlement = clearing.partialSettlement || {};
        clearing.partialSettlement.input =
          clearing.partialSettlement.input || [];
        clearing.partialSettlement.output =
          clearing.partialSettlement.output || [];
        return clearing;
      })
      .mergeMap(clearing =>
        SettlementHelper.generateSettlements$(clearing)
          .toArray()
          .map(settlements => {
            return { clearing, settlements };
          })
      )
      .mergeMap(({ clearing, settlements }) =>
        Rx.Observable.merge(
          SettlementDA.generateSettlementInsertStatement$(settlements),
          SettlementHelper.generateCollateralClearingsMods$(
            clearing.businessId,
            settlements
          ),
          mongoDB.generateMoveDocumentToOtherCollectionsStatements$(
            ClearingDA.openClearingCollectionName,
            ClearingDA.closedClearingCollectionName,
            clearing._id
          )
        ).toArray()
      )
      .mergeMap(statements => mongoDB.applyAll$(statements))
      .map(([txs, txResult]) => `Settlement job trigger handling for business ${settlementJobTriggered.businessId}: ok:${txResult.result.ok}`)
      .catch(error => {
        console.log(`An error was generated while a settlementJobTriggered was being processed: ${error.stack}`);
        return this.errorHandler$(error.stack, settlementJobTriggered);
    });
  }


  /**
   * Handles and persist the errors generated while a settlementJobTriggered was being processed.
   * @param {*} error Error
   * @param {*} event settlementJobTriggered event
   */
  errorHandler$(error, event){
    return Rx.Observable.of({error, event})
    .mergeMap(log => LogErrorDA.persistAccumulatedTransactionsError$(log))
  }



}

/**
 * Transaction accumulated event consumer
 * @returns {SettlementCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new SettlementES();
    console.log("SettlementES Singleton created");
  }
  return instance;
};
