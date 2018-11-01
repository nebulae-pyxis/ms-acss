const withFilter = require("graphql-subscriptions").withFilter;
const { CustomError } = require("../../tools/customError");
const RoleValidator  = require("../../tools/RoleValidator");
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const Rx = require("rxjs");
const broker = require("../../broker/BrokerFactory")();
const contextName = "acss";

//Every single error code
// please use the prefix assigned to this microservice
const INTERNAL_SERVER_ERROR_CODE = 17001;
const PERMISSION_DENIED_ERROR_CODE = 17002;

function getResponseFromBackEnd$(response) {
    return Rx.Observable.of(response)
        .map(resp => {
            if (resp.result.code != 200) {
                const err = new Error();
                err.name = 'Error';
                err.message = resp.result.error;
                // this[Symbol()] = resp.result.error;
                Error.captureStackTrace(err, 'Error');
                throw err;
            }
            return resp.data;
        });
}

/**
 * Handles errors
 * @param {*} err
 * @param {*} operationName
 */
function handleError$(err, methodName) {
    return Rx.Observable.of(err).map(err => {
      const exception = { data: null, result: {} };
      const isCustomError = err instanceof CustomError;
      if (!isCustomError) {
        err = new CustomError(err.name, methodName, INTERNAL_SERVER_ERROR_CODE, err.message);
      }
      exception.result = {
        code: err.code,
        error: { ...err.getContent() }
      };
      return exception;
    });
  }


module.exports = {

    //// QUERY ///////
    Query: {
        getACSSBusiness(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getACSSBusiness",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["business-owner"]
            )
              .mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Business",
                  "emigateway.graphql.query.getACSSBusiness",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getACSSBusiness"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getACSSBusinesses(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getACSSBusinesses",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            )
              .mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Business",
                  "emigateway.graphql.query.getACSSBusinesses",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getACSSBusinesses"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getBusinessById(root, args, context) {
          return RoleValidator.checkPermissions$(
            context.authToken.realm_access.roles,
            contextName,
            "getBusinessById",
            PERMISSION_DENIED_ERROR_CODE,
            "Permission denied",
            ["SYSADMIN", "business-owner"]
          )
            .mergeMap(response => {
              return broker.forwardAndGetReply$(
                "Business",
                "emigateway.graphql.query.getBusinessById",
                { root, args, jwt: context.encodedToken },
                2000
              );
            })
            .catch(err => handleError$(err, "getBusinessById"))
            .mergeMap(response => getResponseFromBackEnd$(response))
            .toPromise();
      },
        getAllClearingsFromBusiness(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getAllClearingsFromBusiness",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Clearing",
                  "emigateway.graphql.query.getAllClearingsFromBusiness",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getAllClearingsFromBusiness"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getClearingById(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getClearingById",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Clearing",
                  "emigateway.graphql.query.getClearingById",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getClearingById"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getAccumulatedTransactionsByIds(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getAccumulatedTransactionsByIds",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Clearing",
                  "emigateway.graphql.query.getAccumulatedTransactionsByIds",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getAccumulatedTransactionsByIds"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getAccumulatedTransactionsByClearingId(root, args, context) {
          return RoleValidator.checkPermissions$(
            context.authToken.realm_access.roles,
            contextName,
            "getAccumulatedTransactionsByClearingId",
            PERMISSION_DENIED_ERROR_CODE,
            "Permission denied",
            ["SYSADMIN", "business-owner"]
          ).mergeMap(response => {
              return broker.forwardAndGetReply$(
                "Clearing",
                "emigateway.graphql.query.getAccumulatedTransactionsByClearingId",
                { root, args, jwt: context.encodedToken },
                2000
              );
            })
            .catch(err => handleError$(err, "getAccumulatedTransactionsByClearingId"))
            .mergeMap(response => getResponseFromBackEnd$(response))
            .toPromise();
      },
        getTransactionsByIds(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getTransactionsByIds",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Clearing",
                  "emigateway.graphql.query.getTransactionsByIds",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getTransactionsByIds"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getTransactionsByAccumulatedTransactionId(root, args, context) {
          return RoleValidator.checkPermissions$(
            context.authToken.realm_access.roles,
            contextName,
            "getTransactionsByAccumulatedTransactionId",
            PERMISSION_DENIED_ERROR_CODE,
            "Permission denied",
            ["SYSADMIN", "business-owner"]
          ).mergeMap(response => {
              return broker.forwardAndGetReply$(
                "Clearing",
                "emigateway.graphql.query.getTransactionsByAccumulatedTransactionId",
                { root, args, jwt: context.encodedToken },
                2000
              );
            })
            .catch(err => handleError$(err, "getTransactionsByAccumulatedTransactionId"))
            .mergeMap(response => getResponseFromBackEnd$(response))
            .toPromise();
      },
        getSettlementsByClearingId(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getSettlementsByClearingId",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Settlement",
                  "emigateway.graphql.query.getSettlementsByClearingId",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getSettlementsByClearingId"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getSettlementsCountByClearingId(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getSettlementsCountByClearingId",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Settlement",
                  "emigateway.graphql.query.getSettlementsCountByClearingId",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getSettlementsByClearingId"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getSettlementsByBusinessId(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getSettlementsByBusinessId",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Settlement",
                  "emigateway.graphql.query.getSettlementsByBusinessId",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getSettlementsByBusinessId"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getSettlementsCountByBusinessId(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getSettlementsCountByBusinessId",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN", "business-owner"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Settlement",
                  "emigateway.graphql.query.getSettlementsCountByBusinessId",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getSettlementsCountByBusinessId"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getAccumulatedTransactionErrors(root, args, context) {
          return RoleValidator.checkPermissions$(
            context.authToken.realm_access.roles,
            contextName,
            "getAccumulatedTransactionErrors",
            PERMISSION_DENIED_ERROR_CODE,
            "Permission denied",
            ["SYSADMIN"]
          ).mergeMap(response => {
              return broker.forwardAndGetReply$(
                "LogError",
                "emigateway.graphql.query.getAccumulatedTransactionErrors",
                { root, args, jwt: context.encodedToken },
                2000
              );
            })
            .catch(err => handleError$(err, "getAccumulatedTransactionErrors"))
            .mergeMap(response => getResponseFromBackEnd$(response))
            .toPromise();
      },
      getAccumulatedTransactionErrorsCount(root, args, context) {
        return RoleValidator.checkPermissions$(
          context.authToken.realm_access.roles,
          contextName,
          "getAccumulatedTransactionErrorsCount",
          PERMISSION_DENIED_ERROR_CODE,
          "Permission denied",
          ["SYSADMIN"]
        ).mergeMap(response => {
            return broker.forwardAndGetReply$(
              "LogError",
              "emigateway.graphql.query.getAccumulatedTransactionErrorsCount",
              { root, args, jwt: context.encodedToken },
              2000
            );
          })
          .catch(err => handleError$(err, "getAccumulatedTransactionErrorsCount"))
          .mergeMap(response => getResponseFromBackEnd$(response))
          .toPromise();
    },
          getClearingErrors(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              contextName,
              "getClearingErrors",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["SYSADMIN"]
            ).mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "LogError",
                  "emigateway.graphql.query.getClearingErrors",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getClearingErrors"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
        },
        getClearingErrorsCount(root, args, context) {
          return RoleValidator.checkPermissions$(
            context.authToken.realm_access.roles,
            contextName,
            "getClearingErrorsCount",
            PERMISSION_DENIED_ERROR_CODE,
            "Permission denied",
            ["SYSADMIN"]
          ).mergeMap(response => {
              return broker.forwardAndGetReply$(
                "LogError",
                "emigateway.graphql.query.getClearingErrorsCount",
                { root, args, jwt: context.encodedToken },
                2000
              );
            })
            .catch(err => handleError$(err, "getClearingErrorsCount"))
            .mergeMap(response => getResponseFromBackEnd$(response))
            .toPromise();
      },
      getSettlementErrors(root, args, context) {
        return RoleValidator.checkPermissions$(
          context.authToken.realm_access.roles,
          contextName,
          "getSettlementErrors",
          PERMISSION_DENIED_ERROR_CODE,
          "Permission denied",
          ["SYSADMIN"]
        ).mergeMap(response => {
            return broker.forwardAndGetReply$(
              "LogError",
              "emigateway.graphql.query.getSettlementErrors",
              { root, args, jwt: context.encodedToken },
              2000
            );
          })
          .catch(err => handleError$(err, "getSettlementErrors"))
          .mergeMap(response => getResponseFromBackEnd$(response))
          .toPromise();
      },
      getSettlementErrorsCount(root, args, context) {
        return RoleValidator.checkPermissions$(
          context.authToken.realm_access.roles,
          contextName,
          "getSettlementErrorsCount",
          PERMISSION_DENIED_ERROR_CODE,
          "Permission denied",
          ["SYSADMIN"]
        ).mergeMap(response => {
            return broker.forwardAndGetReply$(
              "LogError",
              "emigateway.graphql.query.getSettlementErrorsCount",
              { root, args, jwt: context.encodedToken },
              2000
            );
          })
          .catch(err => handleError$(err, "getSettlementErrorsCount"))
          .mergeMap(response => getResponseFromBackEnd$(response))
          .toPromise();
      },
    },

    //// MUTATIONS ///////
    Mutation: {
      changeSettlementState(root, args, context) {
        return RoleValidator.checkPermissions$(
          context.authToken.realm_access.roles,
          contextName,
          "changeSettlementState",
          PERMISSION_DENIED_ERROR_CODE,
          "Permission denied",
          ["business-owner"]
        )
          .mergeMap(roles => {
            return context.broker.forwardAndGetReply$(
              "Settlement",
              "emigateway.graphql.mutation.changeSettlementState",
              { root, args, jwt: context.encodedToken },
              2000
            );
          })
          .catch(err => handleError$(err, "changeSettlementState"))
          .mergeMap(response => getResponseFromBackEnd$(response))
          .toPromise();
      },
    },

    //// SUBSCRIPTIONS ///////
    Subscription: {
        ACSSHelloWorldSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("ACSSHelloWorldSubscription");
                },
                (payload, variables, context, info) => {
                    return true;
                }
            )
        }

    }
};



//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
    {
        backendEventName: 'ACSSHelloWorldEvent',
        gqlSubscriptionName: 'ACSSHelloWorldSubscription',
        dataExtractor: (evt) => evt.data,// OPTIONAL, only use if needed
        onError: (error, descriptor) => console.log(`Error processing ${descriptor.backendEventName}`),// OPTIONAL, only use if needed
        onEvent: (evt, descriptor) => console.log(`Event of type  ${descriptor.backendEventName} arraived`),// OPTIONAL, only use if needed
    },
];


/**
 * Connects every backend event to the right GQL subscription
 */
eventDescriptors.forEach(descriptor => {
    broker
        .getMaterializedViewsUpdates$([descriptor.backendEventName])
        .subscribe(
            evt => {
                if (descriptor.onEvent) {
                    descriptor.onEvent(evt, descriptor);
                }
                const payload = {};
                payload[descriptor.gqlSubscriptionName] = descriptor.dataExtractor ? descriptor.dataExtractor(evt) : evt.data
                pubsub.publish(descriptor.gqlSubscriptionName, payload);
            },

            error => {
                if (descriptor.onError) {
                    descriptor.onError(error, descriptor);
                }
                console.error(
                    `Error listening ${descriptor.gqlSubscriptionName}`,
                    error
                );
            },

            () =>
                console.log(
                    `${descriptor.gqlSubscriptionName} listener STOPPED.`
                )
        );
});


