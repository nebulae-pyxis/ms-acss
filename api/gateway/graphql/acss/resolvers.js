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
        getHelloWorldFromACSS(root, args, context) {
            return broker
                .forwardAndGetReply$(
                    "HelloWorld",
                    "gateway.graphql.query.getHelloWorldFromACSS",
                    { root, args, jwt: context.encodedToken },
                    2000
                )
                .mergeMap(response => getResponseFromBackEnd$(response))
                .toPromise();
        },
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
                  "gateway.graphql.query.getACSSBusiness",
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
              ["system-admin", "business-owner"]
            )
              .mergeMap(response => {
                return broker.forwardAndGetReply$(
                  "Business",
                  "gateway.graphql.query.getACSSBusinesses",
                  { root, args, jwt: context.encodedToken },
                  2000
                );
              })
              .catch(err => handleError$(err, "getACSSBusinesses"))
              .mergeMap(response => getResponseFromBackEnd$(response))
              .toPromise();
          }
    },

    //// MUTATIONS ///////


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
                    `${descriptor.gqlSubscriptionName} listener STOPED`
                )
        );
});


