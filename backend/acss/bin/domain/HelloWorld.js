"use strict";

const Rx = require("rxjs");
const HelloWorldDA = require("../data/HelloWorldDA");
const broker = require("../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const {
  CustomError,
  DefaultError
} = require("../tools/customError");

/**
 * Singleton instance
 */
let instance;

class HelloWorld {
  constructor() {
    this.initHelloWorldEventGenerator();
  }

  /**
   *  HelloWorld Query, please remove
   *  this is a queiry form GraphQL
   */
  getHelloWorld$(request) {
    console.log(`request: request`)
    return HelloWorldDA.getHelloWorld$()
      .mergeMap(rawResponse => this.buildSuccessResponse$(rawResponse))
      .catch(err => this.errorHandler$(err));
  }

  /**
   * Handle HelloWorld Query, please remove
   * This in an Event HAndler for Event- events
   */
  handleHelloWorld$(evt) {
    return Rx.Observable.of('Some process for HelloWorld event');
  }


  initHelloWorldEventGenerator(){
    Rx.Observable.interval(1000)
    .take(120)
    .mergeMap(id =>  HelloWorldDA.getHelloWorld$())    
    .mergeMap(evt => {
      return broker.send$(MATERIALIZED_VIEW_TOPIC, 'ACSSHelloWorldEvent',evt);
    }).subscribe(
      (evt) => console.log('Gateway GraphQL sample event sent, please remove'),
      (err) => console.error('Gateway GraphQL sample event sent ERROR, please remove'),
      () => console.log('Gateway GraphQL sample event sending STOPPED, please remove'),
    );
  }




  //#region  mappers for API responses
  errorHandler$(err) {
    return Rx.Observable.of(err)
      .map(err => {
        const exception = { data: null, result: {} };
        const isCustomError = err instanceof CustomError;
        if(!isCustomError){
          err = new DefaultError(err)
        }
        exception.result = {
            code: err.code,
            error: {...err.getContent()}
          }
        return exception;
      });
  }

  
  buildSuccessResponse$(rawRespponse) {
    return Rx.Observable.of(rawRespponse)
      .map(resp => {
        return {
          data: resp,
          result: {
            code: 200
          }
        }
      });
  }

  //#endregion


}

module.exports = () => {
  if (!instance) {
    instance = new HelloWorld();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
