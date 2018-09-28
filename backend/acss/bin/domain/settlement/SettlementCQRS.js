const Rx = require("rxjs");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const SettlementDA = require("../../data/SettlementDA");
const AccumulatedTransactionDA = require("../../data/AccumulatedTransactionDA");
const RoleValidator = require("../../tools/RoleValidator");
const { CustomError, DefaultError } = require("../../tools/customError");
const {
  PERMISSION_DENIED_ERROR_CODE,
  INTERNAL_SERVER_ERROR_CODE
} = require("../../tools/ErrorCodes");

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

  /**
   * Gets the settlements associated with the specified clearing id
   *
   * @param args args
   * @param args.clearingId Id of the clearing 
   */
  getSettlementsByClearingId$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getSettlementsByClearingId$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN", "business-owner"]
    )
      .mergeMap(roles => {
        return SettlementDA.getSettlementsByClearingId$(args.page, args.count, args.clearingId, roles.SYSADMIN ? undefined:authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

      /**
   * Gets the amount of settlements associated with the specified clearing id
   *
   * @param args args
   * @param args.clearingId Id of the clearing 
   */
  getSettlementsCountByClearingId$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getSettlementsCountByClearingId$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN", "business-owner"]
    )
      .mergeMap(roles => {
        return SettlementDA.getSettlementsCountByClearingId$(args.clearingId, roles.SYSADMIN ? undefined:authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

  /**
   * Gets the settlements of a business
   *
   * @param args args
   * @param args.businessId Id of the business (This values is taken into account if the user that perform the request has the role SYSADMIN)
   */
  getSettlementsByBusinessId$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getSettlementsByBusinessId$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN", "business-owner"]
    )
      .mergeMap(roles =>{
        args.businessId = roles.SYSADMIN ? args.businessId: null;
        return SettlementDA.getSettlementsByBusinessId$(args.page, args.count, args.businessId ? args.businessId : authToken.businessId);
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

      /**
   * Gets the amount of settlements associated with the specified business id
   *
   * @param args args
   * @param args.businessId Id of the business 
   */
  getSettlementsCountByBusinessId$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getSettlementsCountByBusinessId$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN", "business-owner"]
    )
      .mergeMap(roles => {
        args.businessId = roles.SYSADMIN ? args.businessId: null;
        return SettlementDA.getSettlementsCountByBusinessId$(args.businessId ? args.businessId : authToken.businessId)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }


  /**
   * Changes settlement state
   *
   * @param {*} args args.settlementId Id of the settlement to update
   * @param {*} args args.settlementState New settlement state to assign to the settlement
   * @param {string} authToken JWT token
   */
  changeSettlementState$({args}, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "changeSettlementState$()",
      PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["business-owner"]
    )
      .mergeMap(roles => {
        return SettlementDA.changeSettlementState$(
          args.settlementId,
          args.settlementState,
          authToken.businessId
        ).map(result => {
        return {
          code: 200,
          message: `Settlement with id: ${args.settlementId} has been updated`
        };
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.handleError$(err));
    })
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
