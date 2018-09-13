"use strict";

const Rx = require("rxjs");
const ClearingDA = require("../data/ClearingDA");
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
   * @param args.businessId Id if the business
   */
  getClearingsFromBusiness$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "BusinessManagement",
      "changeBusinessState$()",
      BUSINESS_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      ["system-admin", "business-owner"]
    )
      .mergeMap(val =>
        ClearingDA.getClearingsFromBusiness$(
          args.businessId ? args.businessId : authToken.businessId
        )
      )
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

  //#region  mappers for API responses

  handleError$(err) {
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
