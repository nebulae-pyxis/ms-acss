"use strict";

const broker = require("../../tools/broker/BrokerFactory")();
const Rx = require("rxjs");
const jsonwebtoken = require("jsonwebtoken");
const business = require("../../domain/Business")();
const clearing = require("../../domain/Clearing")();
const settlement = require("../../domain/settlement/");
const logError = require("../../domain/log-error/");
const jwtPublicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");

let instance;

class GraphQlService {


  constructor() {
    this.functionMap = this.generateFunctionMap();
    this.subscriptions = [];
  }

  /**
   * Starts GraphQL actions listener
   */
  start$() {

    //default on error handler
    const onErrorHandler = error => {
      console.error("Error handling  GraphQl incoming event", error);
      process.exit(1);
    };

    //default onComplete handler
    const onCompleteHandler = () => {
      () => console.log("GraphQlService incoming event subscription completed");
    };
    return Rx.Observable.from(this.getSubscriptionDescriptors())
      .map(aggregateEvent => { return { ...aggregateEvent, onErrorHandler, onCompleteHandler } })
      .map(params => this.subscribeEventHandler(params));
  }

  /**
   * build a Broker listener to handle GraphQL requests procesor
   * @param {*} descriptor 
   */
  subscribeEventHandler({
    aggregateType,
    messageType,
    onErrorHandler,
    onCompleteHandler
  }) {
    const handler = this.functionMap[messageType];
    const subscription = broker
      .getMessageListener$([aggregateType], [messageType])
      .mergeMap(message => this.verifyRequest$(message))
      .mergeMap(request => (request.failedValidations.length > 0)
        ? Rx.Observable.of(request.errorResponse)
        : Rx.Observable.of(request)
          //ROUTE MESSAGE TO RESOLVER
          .mergeMap(({ authToken, message }) =>
            handler.fn
              .call(handler.obj, message.data, authToken)
              .map(response => ({ response, correlationId: message.id, replyTo: message.attributes.replyTo }))
          )
      )
      .mergeMap(msg => this.sendResponseBack$(msg))
      .subscribe(
        msg => {
          // console.log(`GraphQlService: ${messageType} process: ${msg}`);
        },
        onErrorHandler,
        onCompleteHandler
      );
    this.subscriptions.push({
      aggregateType,
      messageType,
      handlerName: handler.fn.name,
      subscription
    });
    return {
      aggregateType,
      messageType,
      handlerName: `${handler.obj.name}.${handler.fn.name}`
    };
  }

  /**
   * Verify the message if the request is valid.
   * @param {any} request request message
   * @returns { Rx.Observable< []{request: any, failedValidations: [] }>}  Observable object that containg the original request and the failed validations
   */
  verifyRequest$(request) {
    return Rx.Observable.of(request)
      //decode and verify the jwt token
      .mergeMap(message =>
        Rx.Observable.of(message)
          .map(message => ({ authToken: jsonwebtoken.verify(message.data.jwt, jwtPublicKey), message, failedValidations: [] }))
          .catch(err =>
            this.handleError$(err)
              .map(response => ({
                errorResponse: { response, correlationId: message.id, replyTo: message.attributes.replyTo },
                failedValidations: ['JWT']
              }
              ))
          )
      )
  }

  handleError$(err) {
    return Rx.Observable.of(err).map(err => {
      const exception = { data: null, result: {}};
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

  /**
   * 
   * @param {any} msg Object with data necessary  to send response
   */
  sendResponseBack$(msg) {
    return Rx.Observable.of(msg).mergeMap(
      ({ response, correlationId, replyTo }) =>
        replyTo
          ? broker.send$(replyTo, "emigateway.graphql.Query.response", response, {
            correlationId
          })
          : Rx.Observable.of(undefined)
    );
  }

  stop$() {
    Rx.Observable.from(this.subscriptions).map(subscription => {
      subscription.subscription.unsubscribe();
      return `Unsubscribed: aggregateType=${aggregateType}, eventType=${eventType}, handlerName=${handlerName}`;
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  /////////////////// CONFIG SECTION, ASSOC EVENTS AND PROCESSORS BELOW  /////////////////
  ////////////////////////////////////////////////////////////////////////////////////////


  /**
   * returns an array of broker subscriptions for listening to GraphQL requests
   */
  getSubscriptionDescriptors() {
    console.log("GraphQl Service starting ...");
    return [
      {
        aggregateType: "Business",
        messageType: "emigateway.graphql.query.getACSSBusiness"
      },
      {
        aggregateType: "Business",
        messageType: "emigateway.graphql.query.getACSSBusinesses"
      },
      {
        aggregateType: "Business",
        messageType: "emigateway.graphql.query.getBusinessById"
      },
      {
        aggregateType: "Clearing",
        messageType: "emigateway.graphql.query.getAllClearingsFromBusiness"
      },
      {
        aggregateType: "Clearing",
        messageType: "emigateway.graphql.query.getClearingById"
      },
      {
        aggregateType: "Clearing",
        messageType: "emigateway.graphql.query.getAccumulatedTransactionsByIds"
      },
      {
        aggregateType: "Clearing",
        messageType: "emigateway.graphql.query.getAccumulatedTransactionsByClearingId"
      },
      {
        aggregateType: "Clearing",
        messageType: "emigateway.graphql.query.getTransactionsByIds"
      },
      {
        aggregateType: "Clearing",
        messageType: "emigateway.graphql.query.getTransactionsByAccumulatedTransactionId"
      },
      {
        aggregateType: "Settlement",
        messageType: "emigateway.graphql.query.getSettlementsByClearingId"
      },
      {
        aggregateType: "Settlement",
        messageType: "emigateway.graphql.query.getSettlementsCountByClearingId"
      },
      {
        aggregateType: "Settlement",
        messageType: "emigateway.graphql.query.getSettlementsByBusinessId"
      },
      {
        aggregateType: "Settlement",
        messageType: "emigateway.graphql.query.getSettlementsCountByBusinessId"
      },
      {
        aggregateType: "LogError",
        messageType: "emigateway.graphql.query.getAccumulatedTransactionErrors"
      },
      {
        aggregateType: "LogError",
        messageType: "emigateway.graphql.query.getAccumulatedTransactionErrorsCount"
      },
      {
        aggregateType: "LogError",
        messageType: "emigateway.graphql.query.getClearingErrors"
      },
      {
        aggregateType: "LogError",
        messageType: "emigateway.graphql.query.getClearingErrorsCount"
      },
      {
        aggregateType: "LogError",
        messageType: "emigateway.graphql.query.getSettlementErrors"
      },
      {
        aggregateType: "LogError",
        messageType: "emigateway.graphql.query.getSettlementErrorsCount"
      },
      {
        aggregateType: "Settlement",
        messageType: "emigateway.graphql.mutation.changeSettlementState"
      }
    ];
  }

  /**
   * returns a map that assocs GraphQL request with its processor
   */
  generateFunctionMap() {
    return {
      'emigateway.graphql.query.getACSSBusiness': {
        fn: business.getACSSBusiness$,
        obj: business
      },
      'emigateway.graphql.query.getACSSBusinesses': {
        fn: business.getACSSBusinesses$,
        obj: business
      }, 
      'emigateway.graphql.query.getBusinessById': {
        fn: business.getBusinessById$,
        obj: business
      }, 
      'emigateway.graphql.query.getAllClearingsFromBusiness': {
        fn: clearing.getClearingsFromBusiness$,
        obj: clearing
      },    
      'emigateway.graphql.query.getClearingById': {
        fn: clearing.getClearingById$,
        obj: clearing
      },
      'emigateway.graphql.query.getAccumulatedTransactionsByIds': {
        fn: clearing.getAccumulatedTransactionsByIds$,
        obj: clearing
      },
      'emigateway.graphql.query.getAccumulatedTransactionsByClearingId': {
        fn: clearing.getAccumulatedTransactionsByClearingId$,
        obj: clearing
      },
      'emigateway.graphql.query.getTransactionsByIds': {
        fn: clearing.getTransactionsByIds$,
        obj: clearing
      },
      'emigateway.graphql.query.getTransactionsByAccumulatedTransactionId': {
        fn: clearing.getTransactionsByAccumulatedTransactionId$,
        obj: clearing
      },
      'emigateway.graphql.query.getSettlementsByClearingId': {
        fn: settlement.cqrs.getSettlementsByClearingId$,
        obj: settlement.cqrs
      },
      'emigateway.graphql.query.getSettlementsCountByClearingId': {
        fn: settlement.cqrs.getSettlementsCountByClearingId$,
        obj: settlement.cqrs
      },
      'emigateway.graphql.query.getSettlementsByBusinessId': {
        fn: settlement.cqrs.getSettlementsByBusinessId$,
        obj: settlement.cqrs
      },
      'emigateway.graphql.query.getSettlementsCountByBusinessId': {
        fn: settlement.cqrs.getSettlementsCountByClearingId$,
        obj: settlement.cqrs
      },
      'emigateway.graphql.query.getAccumulatedTransactionErrors': {
        fn: logError.cqrs.getAccumulatedTransactionErrors$,
        obj: logError.cqrs
      },
      'emigateway.graphql.query.getAccumulatedTransactionErrorsCount': {
        fn: logError.cqrs.getAccumulatedTransactionErrorsCount$,
        obj: logError.cqrs
      },
      'emigateway.graphql.query.getClearingErrors': {
        fn: logError.cqrs.getClearingErrors$,
        obj: logError.cqrs
      },
      'emigateway.graphql.query.getClearingErrorsCount': {
        fn: logError.cqrs.getClearingErrorsCount$,
        obj: logError.cqrs
      },
      'emigateway.graphql.query.getSettlementErrors': {
        fn: logError.cqrs.getSettlementErrors$,
        obj: logError.cqrs
      },
      'emigateway.graphql.query.getSettlementErrorsCount': {
        fn: logError.cqrs.getSettlementErrorsCount$,
        obj: logError.cqrs
      },
      'emigateway.graphql.mutation.changeSettlementState': {
        fn: settlement.cqrs.changeSettlementState$,
        obj: settlement.cqrs
      },
    };
  }
}


module.exports = () => {
  if (!instance) {
    instance = new GraphQlService();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
