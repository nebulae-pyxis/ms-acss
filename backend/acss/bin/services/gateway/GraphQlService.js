"use strict";

const broker = require("../../tools/broker/BrokerFactory")();
const Rx = require("rxjs");
const jsonwebtoken = require("jsonwebtoken");
const business = require("../../domain/Business")();
const clearing = require("../../domain/Clearing")();
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
        aggregateType: "Clearing",
        messageType: "gateway.graphql.query.getAllClearingsFromBusiness"
      },
      {
        aggregateType: "Clearing",
        messageType: "gateway.graphql.query.getClearingById"
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
      'gateway.graphql.query.getAllClearingsFromBusiness': {
        fn: clearing.getClearingsFromBusiness$,
        obj: clearing
      },    
      'gateway.graphql.query.getClearingById': {
        fn: clearing.getClearingById$,
        obj: clearing
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
