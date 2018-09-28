const Rx = require("rxjs");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const LogErrorDA = require("../../data/LogErrorDA");
const AccumulatedTransactionDA = require("../../data/AccumulatedTransactionDA");
const RoleValidator = require("../../tools/RoleValidator");
const { CustomError, DefaultError } = require("../../tools/customError");
const {
  PERMISSION_DENIED_ERROR_CODE,
  INTERNAL_SERVER_ERROR_CODE
} = require("../../tools/ErrorCodes");

let instance;

class LogErrorCQRS {
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
   * Gets accumulated tx errors
   *
   * @param args args
   * @param args.page Page number to recover
   * @param args.count Amount of rows to recover
   */
  getAccumulatedTransactionErrors$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getAccumulatedTransactionError$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN"]
    )
      .mergeMap(roles => {
        return LogErrorDA.getAccumulatedTransactionErrors$(args.page, args.count)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

    /**
   * Gets accumulated tx errors
   *
   * @param args args
   * @param args.page Page number to recover
   * @param args.count Amount of rows to recover
   */
  getAccumulatedTransactionErrorsCount$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getAccumulatedTransactionErrorsCount$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN"]
    )
      .mergeMap(roles => {
        return LogErrorDA.getAccumulatedTransactionErrorsCount$(args.page, args.count)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

    /**
   * Gets clearing errors
   *
   * @param args args
   * @param args.page Page number to recover
   * @param args.count Amount of rows to recover
   */
  getClearingErrors$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getClearingErrors$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN"]
    )
      .mergeMap(roles => {
        return LogErrorDA.getClearingErrors$(args.page, args.count)
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

      /**
   * Gets clearing errors
   *
   * @param args args
   * @param args.page Page number to recover
   * @param args.count Amount of rows to recover
   */
  getClearingErrorsCount$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getClearingErrorsCount$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN"]
    )
      .mergeMap(roles => {
        return LogErrorDA.getClearingErrorsCount$(args.page, args.count)
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

}

/**
 * Log error
 * @returns {LogErrorCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new LogErrorCQRS();
    console.log("LogErrorCQRS Singleton created");
  }
  return instance;
};
