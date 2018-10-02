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
    .map(aggregateEvent => {return { ...aggregateEvent, onErrorHandler, onCompleteHandler }})
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
      //decode and verify the jwt token
      .mergeMap(message => {        
        return Rx.Observable.of(
          {
            authToken: jsonwebtoken.verify(message.data.jwt, jwtPublicKey),
            message
          }
        )
        .catch(err => {
          return Rx.Observable.of(
            {
              response,
              correlationId: message.id,
              replyTo: message.attributes.replyTo 
            }
          )
          .mergeMap(msg => this.sendResponseBack$(msg))
        })
      })
      //ROUTE MESSAGE TO RESOLVER
      .mergeMap(({ authToken, message }) =>
        handler.fn
          .call(handler.obj, message.data, authToken)
          .map(response => {
            return {
              response,
              correlationId: message.id,
              replyTo: message.attributes.replyTo
            };
          })
      )
      //send response back if neccesary
      .mergeMap(msg => this.sendResponseBack$(msg))
      .catch(error => {
        return Rx.Observable.of(null) // CUSTOM ERROR MISSING HERE 
      })
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

  // send response back if neccesary
  sendResponseBack$(msg) {
    return Rx.Observable.of(msg)
      .mergeMap(({ response, correlationId, replyTo }) => {
        if (replyTo) {
          return broker.send$(
            replyTo,
            "gateway.graphql.Query.response",
            response,
            { correlationId }
          );
        } else {
          return Rx.Observable.of(undefined);
        }
      })
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
        messageType: "gateway.graphql.query.getACSSBusiness"
      },
      {
        aggregateType: "Business",
        messageType: "gateway.graphql.query.getACSSBusinesses"
      },
      {
        aggregateType: "Business",
        messageType: "gateway.graphql.query.getBusinessById"
      },
      {
        aggregateType: "Clearing",
        messageType: "gateway.graphql.query.getAllClearingsFromBusiness"
      },
      {
        aggregateType: "Clearing",
        messageType: "gateway.graphql.query.getClearingById"
      },
      {
        aggregateType: "Clearing",
        messageType: "gateway.graphql.query.getAccumulatedTransactionsByIds"
      },      
      {
        aggregateType: "Clearing",
        messageType: "gateway.graphql.query.getAccumulatedTransactionsByClearingId"
      },
      {
        aggregateType: "Clearing",
        messageType: "gateway.graphql.query.getTransactionsByIds"
      },
      {
        aggregateType: "Clearing",
        messageType: "gateway.graphql.query.getTransactionsByAccumulatedTransactionId"
      },
      {
        aggregateType: "Settlement",
        messageType: "gateway.graphql.query.getSettlementsByClearingId"
      },
      {
        aggregateType: "Settlement",
        messageType: "gateway.graphql.query.getSettlementsCountByClearingId"
      },
      {
        aggregateType: "Settlement",
        messageType: "gateway.graphql.query.getSettlementsByBusinessId"
      },
      {
        aggregateType: "Settlement",
        messageType: "gateway.graphql.query.getSettlementsCountByBusinessId"
      },
      {
        aggregateType: "LogError",
        messageType: "gateway.graphql.query.getAccumulatedTransactionErrors"
      },
      {
        aggregateType: "LogError",
        messageType: "gateway.graphql.query.getAccumulatedTransactionErrorsCount"
      },
      {
        aggregateType: "LogError",
        messageType: "gateway.graphql.query.getClearingErrors"
      },
      {
        aggregateType: "LogError",
        messageType: "gateway.graphql.query.getClearingErrorsCount"
      },
      {
        aggregateType: "LogError",
        messageType: "gateway.graphql.query.getSettlementErrors"
      },
      {
        aggregateType: "LogError",
        messageType: "gateway.graphql.query.getSettlementErrorsCount"
      },
      {
        aggregateType: "Settlement",
        messageType: "gateway.graphql.mutation.changeSettlementState"
      }
    ];
  }

  /**
   * returns a map that assocs GraphQL request with its processor
   */
  generateFunctionMap() {    
    return {
      'gateway.graphql.query.getACSSBusiness': {
        fn: business.getACSSBusiness$,
        obj: business
      },
      'gateway.graphql.query.getACSSBusinesses': {
        fn: business.getACSSBusinesses$,
        obj: business
      }, 
      'gateway.graphql.query.getBusinessById': {
        fn: business.getBusinessById$,
        obj: business
      }, 
      'gateway.graphql.query.getAllClearingsFromBusiness': {
        fn: clearing.getClearingsFromBusiness$,
        obj: clearing
      },    
      'gateway.graphql.query.getClearingById': {
        fn: clearing.getClearingById$,
        obj: clearing
      },
      'gateway.graphql.query.getAccumulatedTransactionsByIds': {
        fn: clearing.getAccumulatedTransactionsByIds$,
        obj: clearing
      },
      'gateway.graphql.query.getAccumulatedTransactionsByClearingId': {
        fn: clearing.getAccumulatedTransactionsByClearingId$,
        obj: clearing
      },
      'gateway.graphql.query.getTransactionsByIds': {
        fn: clearing.getTransactionsByIds$,
        obj: clearing
      },
      'gateway.graphql.query.getTransactionsByAccumulatedTransactionId': {
        fn: clearing.getTransactionsByAccumulatedTransactionId$,
        obj: clearing
      },
      'gateway.graphql.query.getSettlementsByClearingId': {
        fn: settlement.cqrs.getSettlementsByClearingId$,
        obj: settlement.cqrs
      },
      'gateway.graphql.query.getSettlementsCountByClearingId': {
        fn: settlement.cqrs.getSettlementsCountByClearingId$,
        obj: settlement.cqrs
      },
      'gateway.graphql.query.getSettlementsByBusinessId': {
        fn: settlement.cqrs.getSettlementsByBusinessId$,
        obj: settlement.cqrs
      },
      'gateway.graphql.query.getSettlementsCountByBusinessId': {
        fn: settlement.cqrs.getSettlementsCountByClearingId$,
        obj: settlement.cqrs
      },
      'gateway.graphql.query.getAccumulatedTransactionErrors': {
        fn: logError.cqrs.getAccumulatedTransactionErrors$,
        obj: logError.cqrs
      },
      'gateway.graphql.query.getAccumulatedTransactionErrorsCount': {
        fn: logError.cqrs.getAccumulatedTransactionErrorsCount$,
        obj: logError.cqrs
      },
      'gateway.graphql.query.getClearingErrors': {
        fn: logError.cqrs.getClearingErrors$,
        obj: logError.cqrs
      },
      'gateway.graphql.query.getClearingErrorsCount': {
        fn: logError.cqrs.getClearingErrorsCount$,
        obj: logError.cqrs
      },
      'gateway.graphql.query.getSettlementErrors': {
        fn: logError.cqrs.getSettlementErrors$,
        obj: logError.cqrs
      },
      'gateway.graphql.query.getSettlementErrorsCount': {
        fn: logError.cqrs.getSettlementErrorsCount$,
        obj: logError.cqrs
      },
      'gateway.graphql.mutation.changeSettlementState': {
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
