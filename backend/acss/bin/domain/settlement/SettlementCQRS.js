const Rx = require("rxjs");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const ClearingDA = require("../../data/ClearingDA");
const AccumulatedTransactionDA = require("../../data/AccumulatedTransactionDA");

let instance;

class SettlementCQRS {
  constructor() { }



  /**
   * handle the cron job event - handleSettlementJobTriggeredEvent
   *
   * @param {*} settlementJobTriggered cron job event
   * @returns {Rx.Observable}
   */
  handleSettlementJobTriggeredEvent$(settlementJobTriggered) {
    return Rx.Observable.empty();
  }



}

/**
 * Transaction accumulated event consumer
 * @returns {SettlementCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new SettlementCQRS();
    console.log("SettlementCQRS Singleton created");
  }
  return instance;
};
