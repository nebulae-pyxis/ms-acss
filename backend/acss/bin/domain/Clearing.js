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
   * @param args.businessId Id of the business (This values is taken into account if the user that perform the request has the role system-admin)
   */
  getClearingsFromBusiness$({ args }, authToken) {
    console.log('getClearingsFormBusiness -> ', args);
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getClearingsFromBusiness$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["system-admin", "business-owner"]
    )
      .mergeMap(val =>{
        args.businessId = authToken.realm_access.roles.includes("system-admin") ? args.businessId: null;
        return ClearingDA.getAllClearingsFromBusiness$(args.page, args.count, args.businessId ? args.businessId : authToken.businessId);
      })
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => {
        return this.handleError$(err);
      });
  }

    /**
   * Gets the clearing by id
   *
   * @param args args
   * @param args.id Id of the clearing
   */
  getClearingById$({ args }, authToken) {
    console.log('Clearing backedn');
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "ACSS",
      "getClearingsById$()",
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["system-admin", "business-owner"]
    )
      .mergeMap(role => {
        console.log('Role', role);
        return ClearingDA.getClearingByClearingId$(args.id);
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
