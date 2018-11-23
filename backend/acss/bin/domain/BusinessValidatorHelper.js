const Rx = require("rxjs");
const RoleValidator = require("../tools/RoleValidator");
const { CustomError, DefaultError } = require("../tools/customError");
const {
  PERMISSION_DENIED_ERROR_CODE,
  USER_DOES_NOT_BELONG_TO_BUSINESS_ERROR_CODE,
} = require("../tools/ErrorCodes");
const context = "acss";

class BusinessValidatorHelper {

    /**
   * Checks if the user that is performing the operation has the needed permissions to execute the operation
   * @param {*} authToken Token of the user
   * @param {*} context Name of the microservice
   * @param {*} method Method where the verification is being done
   */
  static checkRole$(authToken, method) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      context,
      method,
      PERMISSION_DENIED_ERROR_CODE.code,
      PERMISSION_DENIED_ERROR_CODE.description,
      ["SYSADMIN", "business-owner"]
    );
  }

  static  validateData$(authToken){
    const method = 'getBusiness';
    return this.checkRole$(authToken, method)
    .mergeMap(rol => {
        if(!authToken.businessId){
            return this.createCustomError$(
                USER_DOES_NOT_BELONG_TO_BUSINESS_ERROR_CODE,
                method
            );
        }
        return Rx.Observable.of(rol);
    })
  }

    /**
   * Creates a custom error observable
   * @param {*} errorCode Error code
   * @param {*} methodError Method where the error was generated
   */
  static createCustomError$(errorCode, methodError) {
    return Rx.Observable.throw(
      new CustomError(
        context,
        methodError || "",
        errorCode.code,
        errorCode.description
      )
    );
  }

}

module.exports = BusinessValidatorHelper;