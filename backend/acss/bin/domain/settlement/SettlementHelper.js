const Rx = require("rxjs");
const uuidv4 = require('uuid/v4');
const ClearingDA = require('../../data/ClearingDA');

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

  /**
   * Generates a basic settlement entity
   * @param strinG fromBu 
   * @param strinG toBu 
   * @param strinG clearingId 
   * @param number amount 
   * @returns {Object} Settlement entity
   */
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

  /**
   * Takes the full array of settlements, infer clarings that are affected by the settlements and calculates the modifications.
   * @param {array} settlements array of settlements to be proccesed
   * @returns {Rx.Observable} Stream of mongo statements with the modifications of collaterla afffected clearings
   */
  static generateCollateralClearingsMods$(primaryBusinessId, settlements) {
    return Rx.Observable.from(settlements)
      .mergeMap(settlement =>
        // duplicates all settlements in order to have a groupkey
        Rx.Observable.from([{ ...settlement, groupKey: settlement.fromBu }, { ...settlement, groupKey: settlement.toBu }])
      ).groupBy(settlement => settlement.groupKey)
      .filter(group$ => group$.key !== primaryBusinessId)
      .mergeMap(group$ =>
        Rx.Observable.forkJoin(
          group$.toArray(),
          ClearingDA.getOpenClearingByBusinessId$(group$.key)
        ).mergeMap(([setts, clearing]) => {
          // group gives all the settlements affecting one business
          // the idea at this point is to generate a stream of ( businessId, clearing,  debits, credits ) for futher processing        
          const [debits$, credits$] = Rx.Observable.from(setts).partition(settlement => (settlement.fromBu === group$.key));
          return Rx.Observable.forkJoin(debits$.toArray(), credits$.toArray())
            .map(([debits, credits]) => { return { businessId: group$.key, clearing, debits, credits }; });
        })
      ).mergeMap(({ businessId, clearing, debits, credits }) => Rx.Observable.merge(
        // now that we have all the debits and credits 
        // lets make all the increments/decrements and registries for this clearing
        Rx.Observable.from(debits).map(debit => { return { type: "$inc", field: `output.${debit.toBu}.amount`, value: (debit.amount * -1) }; }),
        Rx.Observable.from(debits).map(debit => { return { type: "$push", field: `partialSettlement.output`, value: { buId: debit.toBu, amount: debit.amount, settlementId: debit._id } }; }),
        Rx.Observable.from(credits).map(credit => { return { type: "$inc", field: `input.${credit.fromBu}.amount`, value: (credit.amount * -1) }; }),
        Rx.Observable.from(credits).map(credit => { return { type: "$push", field: `partialSettlement.input`, value: { buId: credit.fromBu, amount: credit.amount, settlementId: credit._id } }; }),
        Rx.Observable.of( { type: "$set", field: `lastUpdateTimestamp`, value: Date.now() })

      ).reduce(
        //lets put all the increments and pushes on the same transactions
        (acc, operation) => {
          acc.operationArgs[1][operation.type][operation.field] = operation.value;
          return acc;
        },
        {
          collection: ClearingDA.openClearingCollectionName,
          operation: "updateOne",
          operationArgs: [{ _id: clearing._id }, { "$inc": {}, "$push": {},  "$set": {}  }]
        })
      );
  }





}

/**
 * Settlement helpers
 * @returns {SettlementHelper}
 */
module.exports = SettlementHelper;
