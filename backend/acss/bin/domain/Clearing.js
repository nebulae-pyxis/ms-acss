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
   * @param args.businessId Id of the business (This values is taken into account if the user that perform the request has the role SYSADMIN)
   */
  getClearingsFromBusiness$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getClearingsFromBusiness$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN", "business-owner"]
    )
      .mergeMap(roles =>{
        args.businessId = roles.SYSADMIN ? args.businessId: null;
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
      ["SYSADMIN", "business-owner"]
    )
      .mergeMap(role => {
        return ClearingDA.getClearingByClearingId$(args.id, role.SYSADMIN ? undefined: authToken.businessId);
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
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
      ["SYSADMIN", "business-owner"]
    )
      .mergeMap(role => {
        return AccumulatedTransactionDA.getAccumulatedTransactionsByIds$(args.page, args.count, args.ids, role.SYSADMIN ? undefined: authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
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
      ["SYSADMIN", "business-owner"]
    )
      .mergeMap(roles => {
        return TransactionDA.getTransactionsByIds$(args.page, args.count, args.ids, roles.SYSADMIN ? undefined:authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
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
    return Rx.Observable.of(rawRespponse).map(resp => {
      return {
        data: resp,
        result: {
          code: 200
        }
      };
    });
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
