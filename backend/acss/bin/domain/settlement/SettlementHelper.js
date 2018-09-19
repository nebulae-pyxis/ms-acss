const Rx = require("rxjs");
const uuidv4 = require('uuid/v4');

class SettlementHelper {

  constructor() { }






  /**
   * 
   * @param Object clearing 
   * @returns {Rx.Observable}
   */
  static generateSettlements$(clearing) {
    return Rx.Observable.merge(
      Rx.Observable.from(Object.entries(clearing.input))
        .map(([fromBu, { amount }]) => this.buildSettlement(fromBu, clearing.businessId, clearing._id, amount)),
      Rx.Observable.from(Object.entries(clearing.output))
        .map(([toBu, { amount }]) => this.buildSettlement(clearing.businessId, toBu, clearing._id, amount)),
    );

  }

  static buildSettlement(fromBu, toBu, clearingId, amount) {
    return {
      _id: uuidv4(),
      timestamp: Date.now(),
      fromBu,
      toBu,
      clearingId,
      amount
    };
  }



}

/**
 * Settlement helpers
 * @returns {SettlementHelper}
 */
module.exports = SettlementHelper;
