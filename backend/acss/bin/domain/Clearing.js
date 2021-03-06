"use strict";

const Rx = require("rxjs");
const ClearingDA = require("../data/ClearingDA");
const AccumulatedTransactionDA = require("../data/AccumulatedTransactionDA");
const SettlementDA = require("../data/SettlementDA");
const TransactionDA = require("../data/TransactionsDA");
const broker = require("../tools/broker/BrokerFactory")();
const eventSourcing = require("../tools/EventSourcing")();
const RoleValidator = require("../tools/RoleValidator");
const Event = require("@nebulae/event-store").Event;
const uuidv4 = require("uuid/v4");
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const { CustomError, DefaultError } = require("../tools/customError");
const {
  PERMISSION_DENIED_ERROR_CODE,
  INTERNAL_SERVER_ERROR_CODE
} = require("../tools/ErrorCodes");

/**
 * Singleton instance
 */
let instance;

class Clearing {
  constructor() {}

  /**
   * Gets the clearings of a business
   *
   * @param args args
   * @param args.businessId Id of the business (This values is taken into account if the user that perform the request has the role PLATFORM-ADMIN)
   */
  getClearingsFromBusiness$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getClearingsFromBusiness$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["PLATFORM-ADMIN", "BUSINESS-OWNER"]
    )
      .mergeMap(roles =>{
        args.businessId = roles['PLATFORM-ADMIN'] ? args.businessId: null;
        return ClearingDA.getAllClearingsFromBusiness$(args.page, args.count, args.businessId ? args.businessId : authToken.businessId);
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

  /**
   * Gets the clearing by id.
   *
   * @param args args
   * @param args.id Id of the clearing
   */
  getClearingById$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getClearingsById$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["PLATFORM-ADMIN", "BUSINESS-OWNER"]
    )
      .mergeMap(role => {
        return ClearingDA.getClearingByClearingId$(args.id, role['PLATFORM-ADMIN'] ? undefined: authToken.businessId);
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

    /**
   * Gets the accumulated transactions by ids
   *
   * @param args args
   * @param args.ids Ids of the accumulated transactions
   */
  getAccumulatedTransactionsByIds$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getAccumulatedTransactionsByIds$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["PLATFORM-ADMIN", "BUSINESS-OWNER"]
    )
      .mergeMap(role => {
        return AccumulatedTransactionDA.getAccumulatedTransactionsByIds$(args.page, args.count, args.ids, role['PLATFORM-ADMIN'] ? undefined: authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

      /**
   * Gets the accumulated transactions by clearing id
   *
   * @param args args
   * @param args.clearingId Id of the clearing which the accumulated transactions belong
   */
  getAccumulatedTransactionsByClearingId$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getAccumulatedTransactionsByIds$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["PLATFORM-ADMIN", "BUSINESS-OWNER"]
    )
      .mergeMap(roles => ClearingDA.getClearingByClearingId$(args.clearingId).map(clearing  => [roles, clearing]))
      .mergeMap(([role, clearing]) => {
        return AccumulatedTransactionDA.getAccumulatedTransactionsByIds$(args.page, args.count, clearing.accumulatedTransactionIds, role['PLATFORM-ADMIN']? undefined: authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

  /**
   * Gets the transactions by ids
   *
   * @param args args
   * @param args.ids Ids of the transactions
   */
  getTransactionsByIds$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getTransactionsByIds$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["PLATFORM-ADMIN", "BUSINESS-OWNER"]
    )
      .mergeMap(roles => {
        return TransactionDA.getTransactionsByIds$(args.page, args.count, args.ids, roles["PLATFORM-ADMIN"] ? undefined:authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }

    /**
   * Gets the transactions by accumulated tyransaction id and transaction type
   *
   * @param args args
   * @param args.accumulatedTransactionId accumualted transaction id
   * @param args.filterType Transactions type (AFCC_RELOAD, ...)
   */
  getTransactionsByAccumulatedTransactionId$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getTransactionsByAccumulatedTransactionId$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["PLATFORM-ADMIN", "BUSINESS-OWNER"]
    )
      .mergeMap(roles => AccumulatedTransactionDA.getAccumulatedTransaction$(args.accumulatedTransactionId).map(accumulatedTx  => [roles, accumulatedTx]))
      .mergeMap(([roles, accumulatedTransaction]) => {
        const transactionIds = Object.keys(accumulatedTransaction.transactionIds)
        .reduce((acc, key) => acc.concat(accumulatedTransaction.transactionIds[key]), [])
        return TransactionDA.getTransactionsByIds$(args.page, args.count, transactionIds, roles["PLATFORM-ADMIN"] ? undefined:authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
  }
  
  //#region  mappers for API responses

  handleError$(err) {
    console.log('Handle error => ', err);
    return Rx.Observable.of(err).map(err => {
      const exception = { data: null, result: {} };
      const isCustomError = err instanceof CustomError;
      if (!isCustomError) {
        err = new DefaultError(err);
      }
      exception.result = {
        code: err.code,
        error: { ...err.getContent() }
      };
      return exception;
    });
  }

  buildSuccessResponse$(rawRespponse) {
    return Rx.Observable.of(rawRespponse).map(resp => ({
      data: resp,
      result: { code: 200 }
    }));
  }

  //#endregion
}

/**
 * @returns {Clearing}
 */
module.exports = () => {
  if (!instance) {
    instance = new Clearing();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
