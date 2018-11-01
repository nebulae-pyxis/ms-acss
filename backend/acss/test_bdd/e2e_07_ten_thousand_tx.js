// TEST LIBS
const assert = require("assert");
const Rx = require("rxjs");
const uuidv4 = require("uuid/v4");
const expect = require("chai").expect;

//LIBS FOR TESTING
const MqttBroker = require("../bin/tools/broker/MqttBroker");
const MongoDB = require('../bin/data/MongoDB').MongoDB;

let stepCollection = "stepsCollection";


//
let mongoDB = undefined;
let broker = undefined;

const dbName = `test-${uuidv4().toString().slice(0, 5)}-acss`;

const environment = {
  NODE_ENV: "production",
  BROKER_TYPE: "MQTT",
  REPLY_TIMEOUT: 2000,
  GATEWAY_REPLIES_TOPIC_SUBSCRIPTION: "emi-gateway-replies-topic-mbe-acss",
  MQTT_SERVER_URL: "mqtt://localhost:1883",
  MONGODB_URL: "mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs0",
  MONGODB_DB_NAME: dbName ,
  MONGODB_ACSS_DB_NAME: dbName ,
  JWT_PUBLIC_KEY:
    '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6XkGwOK3LrYdtw8BFYGSOp2TSJl7mHE0NIYuzN9LFDj0IxEc46ddmDZFaQJB91PRQKDq4Z2qzcJE3thYj8nTDPiQ4hQMFm5zF6QjPWBqBMMqyaxBK/iXJ8zaf9lD8eRqsZxI6URE5ZILx74ZQmh7lo46/iVXORJNaG159wWU8yNfsL1n63+WKL40mxNjEyu3kI/vvrJYDJG+/N6CrWPH8yYFJxfWDHrZBHl/kW+QrX1OnbI/mybb1r0wnzasnYUgk5k+sRCLV92FPv6NaxUPSO4zk5kkVD6RQ2m0kv+ynzYAx6Ou1Z/khz/Y7OuP0p/PBAyFAu2HAh3rClRB6nTfnwIDAQAB\n-----END PUBLIC KEY-----',
  EVENT_STORE_BROKER_TYPE: "MQTT",
  EVENT_STORE_BROKER_EVENTS_TOPIC: "Events",
  EVENT_STORE_BROKER_URL: "mqtt://localhost:1883",
  EVENT_STORE_STORE_TYPE: "MONGO",
  EVENT_STORE_STORE_URL: "mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs0",
  EVENT_STORE_STORE_AGGREGATES_DB_NAME: "Aggregates",
  EVENT_STORE_STORE_EVENTSTORE_DB_NAME: "EventStore"
};

/*
NOTES:
before run please start mongoDB:
  docker-compose up setup-rs

  remember to config /etc/hosts to resolve store-mongo1, store-mongo2, store-mongo3
    127.0.0.1 store-mongo1
    127.0.0.1 store-mongo2
    127.0.0.1 store-mongo3

*/

describe("E2E - Simple transaction", function() {

  /*
  * PREAPARE
  */
  describe("Prepare test DB and backends", function () {
    it("start acss server", function (done) {
      this.timeout(30000);
      Object.keys(environment).forEach(envKey => {
        process.env[envKey] = environment[envKey];
        // console.log(`env var set => ${envKey}:${process.env[envKey]}`);
      });

      const eventSourcing = require('../bin/tools/EventSourcing')();
      const eventStoreService = require('../bin/services/event-store/EventStoreService')();
      mongoDB = require('../bin/data/MongoDB').singleton();
      const ClearingDA = require('../bin/data/ClearingDA');
      const SettlementDA = require('../bin/data/SettlementDA');
      const BusinessDA = require('../bin/data/BusinessDA');
      const TransactionsCursorDA = require('../bin/data/TransactionsCursorDA');
      const TransactionsDA = require('../bin/data/TransactionsDA');
      const LogErrorDA = require('../bin/data/LogErrorDA');
      const AccumulatedTransactionDA = require('../bin/data/AccumulatedTransactionDA');
      const Settlement = require('../bin/domain/settlement/SettlementES')();
      // const graphQlService = require('../bin//services/emi-gateway/GraphQlService')();

      Rx.Observable.concat(
        eventSourcing.eventStore.start$(),
        eventStoreService.start$(),
        mongoDB.start$(),
        BusinessDA.start$(),
        ClearingDA.start$(),
        SettlementDA.start$(),
        TransactionsCursorDA.start$(),
        LogErrorDA.start$(),
        TransactionsDA.start$(),
        AccumulatedTransactionDA.start$(),
        Settlement.start$()
        // graphQlService.start$()
      ).subscribe(
        (evt) => {
          // stepCollection = mongoDB.client.db(dbName).collection('steps');
         },
        (error) => {console.error(error); return done(error); },
        () => { console.log('[[################ 01 ################]] ACSS STARTED'); return done(); }
      );

    }),
    it("start acss-channel server", function (done) {
        this.timeout(3000);
        const eventSourcing = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/tools/EventSourcing')();
        const eventStoreService = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/services/event-store/EventStoreService')();
        const mongoDB = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/MongoDB').singleton();
        const AfccReloadChannelDA = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/AfccReloadChannelDA');
        const AfccReloadsDA = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/AfccReloadsDA');
        const TransactionsDA = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/TransactionsDA');
        const TransactionsErrorsDA = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/TransactionsErrorsDA');
        // const graphQlService = require('./services/emi-gateway/GraphQlService')();
        const Rx = require('rxjs');

        Rx.Observable.concat(
          eventSourcing.eventStore.start$(),
          eventStoreService.start$(),
          mongoDB.start$(),
          Rx.Observable.forkJoin(
            AfccReloadChannelDA.start$(),
            AfccReloadsDA.start$(),
            TransactionsDA.start$(),
            TransactionsErrorsDA.start$()
          ),
          // graphQlService.start$()
        ).subscribe(
          (evt) => {
            // console.log(evt)
          },
          (error) => {
            console.error('Failed to start', error);
            // process.exit(1);
            return done(error);
          },
          () => { console.log('[[################ 02 ################]]  acss-channel-afcc-reload STARTED'); return done(); }
        );

    }),
    it("start MQTT broker", function (done) {      
      Rx.Observable.of({})
      .do(() => {
        broker = new MqttBroker({
          mqttServerUrl: process.env.MQTT_SERVER_URL,
          replyTimeout: process.env.REPLY_TIMEOUT || 2000
        });
      })
      .subscribe(
        (evt) => {},
        (error) => { console.error('Failed to start', error); return done(error); },
        () => { console.log('[[################ 03 ################]]  MQTT BROKER STARTED'); return done(); }
      );
    })
  });

  /*
  * CREATE BUSINESS UNITS
  */
 describe("Create the business units", function() {

   it("Create several business units", function (done) {
     Rx.Observable.from([
       {
         _id: "123456789_Metro_med",
         name: "Metro de Medellin"
       },
       {
        _id: "123456789_Gana",
         name: "Gana Medellin"
       },
       {
        _id: "123456789_NebulaE_POS",
         name: "NebulaE_POS"
       },
       {
         _id: "123456789_PlaceToPay",
         name: "Place to Play"
       },
       {
        _id: "123456789_NebulaE",
         name: "NebulaE"
       },
       {
        _id: "123456789_surplus",
         name: "surplus collector"
       },
       {
        _id: "123456789_Pasarela",
        name: "Pasarela"
       }
     ])
       .delay(10)
       .mergeMap(bu => broker.send$('Events', '', {
         et: "BusinessCreated",
         etv: 1,
         at: "Business",
         aid: bu._id,
         data: { generalInfo: bu, _id: bu._id },
         user: "esteban.zapata",
         timestamp: Date.now(),
         av: 164
       }))
       .toArray()
       .subscribe(
         evt => {},
         error => { console.error(error); return done(error); },
         () => {console.log('[[################ 04 ################ Create several business units DONE ]]'); return done(); });
   });

 });

  /*
  * CREATE acss-reload CHANNEL CONFIG
  */

 describe("Create the channel configuration", function() {

  it("Create one configuration", function (done) {
    this.timeout(7000);
    Rx.Observable.of({})
      .delay(1000)
      .mergeMap(() => broker.send$('Events', '', {
        et: "ACSSConfigurationCreated",
        etv: 1,
        at: "AcssChannel",
        aid: 1,
        data: {
          id: 1,
          fareCollectors: [{
            fromBu: "123456789_Pasarela",
            buId: "123456789_Metro_med",
            percentage: 98.5
          }],
          reloadNetworks: [
            {
              fromBu: "123456789_Pasarela",
              buId: "123456789_Gana",
              percentage: 1.2
            },
            {
              fromBu: "123456789_Pasarela",
              buId: "123456789_NebulaE_POS",
              percentage: 1.35
            }
          ],
          parties: [
            {
              fromBu: "123456789_Pasarela",
              buId: "123456789_PlaceToPay",
              percentage: 45.5
            },
            {
              fromBu: "123456789_Pasarela",
              buId: "123456789_NebulaE",
              percentage: 54.5
            }
          ],
          surplusCollectors: [{
            fromBu: "123456789_Pasarela",
            buId: "123456789_surplus",
          }],
          lastEdition: Date.now()
        },
        user: "juan.santa",
        timestamp: Date.now(),
        av: 164
      }))
    .subscribe(
      result => {},
      error => { console.error(error); return done(error); },
      () => { console.log("[[################ 05 ################ Create one configuration DONE ]]"); return done(); }
    )

  });

});

  /*
  * CREATE 10K RELOADS
  */

  describe("Create ten thousand AFCC reloads and check its transactions", function () {

    it("Create ten thousand AFCC reloads", function (done) {
      this.timeout(7200000);
      const cardId = uuidv4();
      const reloadAmount12_5K = 12500;
      const reloadAmount8k = 8000;
      const reloadAmount10k = 10000;
      const reloadAmount1k = 1000;
      const reloadAmount4k = 4000;

      const nebulaReloader = '123456789_NebulaE_POS';
      const ganaReloader = '123456789_Gana';
      const reloadsEmitter = function(qty, amount, buId){
        const cardId = uuidv4();
        return Rx.Observable.range(0, qty)
        .concatMap(() => broker.send$('Events', '', {
          et: "AfccReloadSold",
          etv: 1,
          at: "Afcc",
          aid: cardId,
          data: {
            amount: amount,
            businessId: buId,
            afcc: {
              data: {
                before: {},
                after: {}
              },
              uId: cardId,
              cardId: cardId,
              balance: {
                before: 0,
                after: amount
              }
            },
            source: {
              machine: "Nesas-12",
              ip: "192.168.1.15"
            }

          },
          user: "juan.santa",
          timestamp: Date.now(),
          av: 1
        })
      )
      }

      Rx.Observable.concat(
        reloadsEmitter(1, reloadAmount12_5K, nebulaReloader),        
        // 1K NEBULA reloads by 12.5K 
        Rx.Observable.of({}).do(() => console.log("1K NEBULA reloads by 12.5K")).delay(1000),
        reloadsEmitter(999, reloadAmount12_5K, nebulaReloader),
        // 1K GANA reloads by 12.5K 
        Rx.Observable.of({}).do(() => console.log("1K GANA reloads by 12.5K")).delay(100),
        reloadsEmitter(1000, reloadAmount12_5K, ganaReloader),
        // 1K NEBULA reloads by 8K 
        Rx.Observable.of({}).do(() => console.log("1K NEBULA reloads by 8K")).delay(100),
        reloadsEmitter(1000, reloadAmount8k, nebulaReloader),        
        // 1K GANA reloads by 8K
        Rx.Observable.of({}).do(() => console.log("1K GANA reloads by 8K")).delay(100),
        reloadsEmitter(1000, reloadAmount8k, ganaReloader),
        // 1K NEBULA reloads by 10K
        Rx.Observable.of({}).do(() => console.log("1K NEBULA reloads by 10K")).delay(100),
        reloadsEmitter(1000, reloadAmount10k, nebulaReloader),
        // 1K GANA reloads by 10K 
        Rx.Observable.of({}).do(() => console.log("1K GANA reloads by 10K")).delay(100),
        reloadsEmitter(1000, reloadAmount10k, ganaReloader),
        // 1K NEBULA reloads by 1K
        Rx.Observable.of({}).do(() => console.log("1K NEBULA reloads by 1K")).delay(100),
        reloadsEmitter(1000, reloadAmount1k, nebulaReloader),
        // 1K GANA reloads by 1K
        Rx.Observable.of({}).do(() => console.log("1K GANA reloads by 1K")).delay(100),
        reloadsEmitter(1000, reloadAmount1k, ganaReloader),
        // 1K NEBULA reloads by 4K
        Rx.Observable.of({}).do(() => console.log("1K NEBULA reloads by 4K")).delay(100),
        reloadsEmitter(1000, reloadAmount4k, nebulaReloader),
        // 1K GANA reloads by 4K
        Rx.Observable.of({}).do(() => console.log("1K GANA reloads by 4K")).delay(100),
        reloadsEmitter(1000, reloadAmount4k, ganaReloader)
      )
      .toArray()
      .subscribe(
        ok => { console.log("##### RELOADS MADE ==> ", ok.length); },
        error => { console.log(error); return done(error); },
        () => { console.log("[[################ 06 ################ Create ten AFCC reloads DONE ]]"); return done(); }
      )
    })

    it('Check all transactions amounts', function (done) {
      this.timeout(7200000);

      const transactionsExpected = { 
        "123456789_Metro_med": 69935000,
        "123456789_Gana": 426000,
        "123456789_NebulaE_POS": 479250, 
        "123456789_PlaceToPay": 72670,
        "123456789_NebulaE": 87030,
        "123456789_surplus": 50,
        "total": 71000000
      };

      const collection = mongoDB.client.db(dbName).collection('Transactions');
      const expectedTransactions = 45000;
      let count = 0;
      Rx.Observable.interval(1000)
        .do(() => console.log("Waiting for all transactions creation...", count))
        .mergeMap(() => Rx.Observable.defer(() => collection.countDocuments()))
        .filter(c => { count = c; return count >= expectedTransactions; })
        .take(1)
        .mergeMap(() => Rx.Observable.bindNodeCallback(collection.find.bind(collection))({})
          .mergeMap(cursor => Rx.Observable.defer(() => MongoDB.extractAllFromMongoCursor$(cursor)))
          .reduce((accumulatedTransactions, tr) => {
            accumulatedTransactions.total += tr.amount * 1000;
            accumulatedTransactions[tr.toBu] += Math.floor(tr.amount * 1000);
            return accumulatedTransactions;            
          }, {
            "123456789_Metro_med": 0, 
            "123456789_NebulaE_POS": 0,
            "123456789_Gana": 0,
            "123456789_PlaceToPay": 0,
            "123456789_NebulaE": 0,
            "123456789_surplus": 0,
            "total": 0
          } )
        )       
        .do((accTransaction) => {
            Object.keys(accTransaction).forEach(e => { accTransaction[e] = accTransaction[e]/1000 });
            console.log("###############################################################", accTransaction);
            expect(accTransaction).to.be.deep.equals(transactionsExpected);
        })
        .subscribe(
          ok => {},
          error => { console.log(error); return done(error); },
          () => {  console.log("[[################ 07 ################ Check all transactions amounts DONE ]]"); return done(); }
        )
    })

  });

  /**
   * CREATE THE NECCESARY COLLECTION TO WOTK WITH TRANSACTIONS
   */
  describe("Create nedded collections", function(){
    it('Create TransactionsCursor, AccumulatedTransactions, Clearing, ClosedClearing and Settlements collections', function(done) {
      this.timeout(10000);
      mongoDB.createCollections$()
      .subscribe(
        result => {},
        error => { console.log(error); return done(error); },
        () => {  console.log("[[################ 08 ################ Create nedded collections DONE ]]"); return done(); }
      )
    })
  })

  // /** RUN THE CLEARING CRONJOB TASK */

  describe("Trigger task to create the ccumulated transactions", function()  {
    
    it("Send the cronjob task to create the accumulated transactions", function(done) {
      this.timeout(7200000);      
      Rx.Observable.of({})
      .delay(3000)
      .mergeMap(() => broker.send$('Events', '', {
        et: "ClearingJobTriggered",
        etv: 1,
        at: "Cronjob",
        aid: 1,
        data: {},
        user: "juan.santa",
        timestamp: Date.now(),
        av: 1
      }) ) 
      .first()
      .subscribe(
        ok => {},
        error => { console.log(error); return done(error); },
        () => { console.log("[[################ 09 ################ Send the cronjob task to create the accumulated transactions DONE ]]"); return done();  }
      )
    }),

    it('Check the accumulated transactions', function(done) {
      this.timeout(7200000); 
      const acumulatedTransactionAmountExpected = 71000000;
      const transactionsExpected = { 
        "123456789_Metro_med": 69935000,
        "123456789_Gana": 426000,
        "123456789_NebulaE_POS": 479250, 
        "123456789_PlaceToPay": 72670,
        "123456789_NebulaE": 87030,
        "123456789_surplus": 50
      };
      const AccTransactionsCollection = mongoDB.client.db(dbName).collection("AccumulatedTransactions"); 

      Rx.Observable.interval(1000)
        .mergeMap(() => Rx.Observable.defer(() => AccTransactionsCollection.find().toArray()))
        .filter(accTransactions => {
          console.log("Waiting for accumulated transactions... ", accTransactions.length )
          return accTransactions.length >= Object.keys(transactionsExpected).length
        })
        .take(1)
        .mergeMap(accTransactions => Rx.Observable.from(Object.keys(transactionsExpected))
          .do(buId => {
            const index = accTransactions.findIndex(t => t.toBu == buId);
            // console.log(buId, "Expected: ", transactionsExpected[buId], "Actual: ", accTransactions[index].amount);
            expect(accTransactions[index].amount).to.be.equals(transactionsExpected[buId]);
            expect(accTransactions).to.be.lengthOf(Object.keys(transactionsExpected).length);
          })
          .map(buId => {
            const index = accTransactions.findIndex(t => t.toBu == buId);
            return { amount: accTransactions[index].amount };
          })
        )
        .toArray()
        .map(accTrans => accTrans.reduce((acc, transaction) => acc + transaction.amount * 1000, 0))
        .do(acumulatedTransactionAmount => {
          expect(acumulatedTransactionAmount / 1000).to.be.equal(acumulatedTransactionAmountExpected)
        })
        .subscribe(
          result => { },
          error => { console.log(error); return done(error); },
          () => { console.log("[[################ 10 ################ Check the accumulated transactions done"); return done(); }
        )
    })
  });

  /**
   * verify the clearings
   */
  describe("Verify clearing", function(){
    it("verify clearing documents quantity", function(done){
      const clearingsExpected = 7;
      Rx.Observable.of({})
      .delay(1000)
      .mapTo(mongoDB.client.db(dbName).collection('Clearing'))
      .mergeMap(collection => Rx.Observable.defer(() => collection.count()))
      .map(count => {
        expect(count).to.be.equals(clearingsExpected);
        return {};
      })
      .subscribe(
        result => {  },
        error => { console.log(error); return done(error); },
        () => { console.log(" [[################ 11 ################ Check the accumulated transactions done"); return done(); }
      )
    }),

    it('verify inputs and outputs', function(done){      
      this.timeout(7200000);
      const clearingCollection = mongoDB.client.db(dbName).collection('Clearing');
      const transactionsExpected = { 
        "123456789_Metro_med": 69935000,
        "123456789_Gana": 426000,
        "123456789_NebulaE_POS": 479250, 
        "123456789_PlaceToPay": 72670,
        "123456789_NebulaE": 87030,
        "123456789_surplus": 50
      };

      Rx.Observable.interval(1000)
        .mergeMap(() => Rx.Observable.defer(() => clearingCollection.find().toArray()))
        .filter(clearings => {
          console.log("waiting for clearings... ", clearings.length);
          return clearings.length >= Object.keys(transactionsExpected).length + 1;
        })
        .take(1)
        .mergeMap(clearings => Rx.Observable.from(clearings)
          .do(clearing => {
            switch (clearing.businessId) {
              case '123456789_Pasarela': {
                expect(Object.keys(clearing.output)).to.be.lengthOf(Object.keys(transactionsExpected).length);
                expect(clearing.accumulatedTransactionIds).to.be.lengthOf(Object.keys(transactionsExpected).length);
                Object.keys(transactionsExpected).forEach(key => {
                  expect(clearing.output[key].amount).to.be.equals(transactionsExpected[key])
                });
                expect(clearing.open).to.be.equals(true);
                expect(clearing.input).to.be.equals(undefined);
                break;
              };
              case '123456789_PlaceToPay': {
                expect(clearing.open).to.be.equals(true);
                expect(clearing.accumulatedTransactionIds).to.be.lengthOf(1);
                expect(clearing.output).to.be.deep.equals(undefined);
                expect(clearing.input['123456789_Pasarela']).to.be.deep.equals({ amount: transactionsExpected['123456789_PlaceToPay'] })
                break;
              };
              case '123456789_Metro_med': {
                expect(clearing.open).to.be.equals(true);
                expect(clearing.accumulatedTransactionIds).to.be.lengthOf(1);
                expect(clearing.output).to.be.deep.equals(undefined);
                expect(clearing.input['123456789_Pasarela']).to.be.deep.equals({ amount: transactionsExpected['123456789_Metro_med'] })
                break;
              };
              case '123456789_NebulaE': {
                expect(clearing.open).to.be.equals(true);
                expect(clearing.accumulatedTransactionIds).to.be.lengthOf(1);
                expect(clearing.output).to.be.deep.equals(undefined);
                expect(clearing.input['123456789_Pasarela']).to.be.deep.equals({ amount: transactionsExpected['123456789_NebulaE'] })
                break;
              };
              case '123456789_NebulaE_POS': {
                expect(clearing.open).to.be.equals(true);
                expect(clearing.accumulatedTransactionIds).to.be.lengthOf(1);
                expect(clearing.output).to.be.deep.equals(undefined);
                expect(clearing.input['123456789_Pasarela']).to.be.deep.equals({ amount: transactionsExpected['123456789_NebulaE_POS'] })
                break;
              };
              case '123456789_Gana': {
                expect(clearing.open).to.be.equals(true);
                expect(clearing.accumulatedTransactionIds).to.be.lengthOf(1);
                expect(clearing.output).to.be.deep.equals(undefined);
                expect(clearing.input['123456789_Pasarela']).to.be.deep.equals({ amount: transactionsExpected['123456789_Gana'] })
                break;
              };
              case '123456789_surplus': {
                expect(clearing.open).to.be.equals(true);
                expect(clearing.accumulatedTransactionIds).to.be.lengthOf(1);
                expect(clearing.output).to.be.deep.equals(undefined);
                expect(clearing.input['123456789_Pasarela']).to.be.deep.equals({ amount: transactionsExpected['123456789_surplus'] })
                break;
              };
              default: expect(1).to.be.equal(0);
            }
          })
        )
      .subscribe(
        result => {  },
        error => { console.log(error); return done(error); },
        () => { console.log("[[################ 12 ################ verify inputs and outputs done"); return done(); }
      )
    })

   })

  /**
   * trigger the task to close the clearings and do the settlements
   */
  describe("test the settlements", function () {
    it('send the cronjob event and Check settlement results', function (done) {
      this.timeout(7200000);
      Rx.Observable.of({})
        .mergeMap(() => Rx.Observable.from([
          "123456789_PlaceToPay", "123456789_Metro_med",
          "123456789_NebulaE", "123456789_NebulaE_POS",
          "123456789_surplus", "123456789_Gana"
        ])
          .concatMap(bu => {
            return Rx.Observable.of({})
              .delay(100)
              .mergeMap(() => {
                console.log("Creating Settlement");
                return broker.send$('Events', '', {
                  et: "SettlementJobTriggered",
                  etv: 1,
                  at: "Cronjob",
                  aid: bu._id,
                  data: { businessId: bu },
                  user: "juan.santa",
                  timestamp: Date.now(),
                  av: 164
                })
              })
          }
          )
        )
        .subscribe(
          result => { },
          error => { console.log(error); return done(error); },
          () => { console.log("[[################ 13 ################send the cronjob event done"); return done(); }
        )
    }),

    it('Check the closed clearings', function (done) {
      this.timeout(7200000);
      const transactionsExpected = { 
        "123456789_Metro_med": 69935000,
        "123456789_Gana": 426000,
        "123456789_NebulaE_POS": 479250, 
        "123456789_PlaceToPay": 72670,
        "123456789_NebulaE": 87030,
        "123456789_surplus": 50
      };
      const closeClearingCollection = mongoDB.client.db(dbName).collection('ClosedClearing');
      Rx.Observable.interval(1000)
      .mergeMap(() => Rx.Observable.defer(() => closeClearingCollection.find().toArray()))
      .do(x => console.log('Current closed Clearing  ==> ', x.length))
      .filter(closedClearings => closedClearings.length >= Object.keys(transactionsExpected).length)
      .take(1)
      .do(result => expect(result).to.be.lengthOf(Object.keys(transactionsExpected).length))
      .mergeMap(closedClearings => Rx.Observable.from(Object.keys(transactionsExpected))
        .do( buId => {
          const index =  closedClearings.findIndex(i => i.businessId == buId);
          expect(closedClearings[index].input['123456789_Pasarela'].amount).to.be.equal(transactionsExpected[buId], "Checking the input in actors")
          expect(closedClearings[index].open).to.be.equal(false);
        })
      )
      .subscribe(
        result => { },
        error => { console.log(error); return done(error); },
        () => { console.log(" [[################ 14 ################ Check the closed clearings"); return done(); }
      )
    }),

    it('Check the opened clearings', function (done) {
      this.timeout(20000);
      const clearingCollection = mongoDB.client.db(dbName).collection('Clearing');
      Rx.Observable.of({})
      .delay(5000)
      .mergeMap(() => Rx.Observable.defer(() => clearingCollection.find().toArray()))
      .do(result => expect(result).to.be.lengthOf(1))
      .mergeMap(closedClearings => Rx.Observable.from(closedClearings)
        .do( openedClearing => {
          expect(openedClearing.open).to.be.equal(true);
          expect(openedClearing.businessId).does.be.equal('123456789_Pasarela');
        })
        )
        .subscribe(
          result => { },
          error => { console.log(error); return done(error); },
        () => { console.log(" [[################ 15 ################ Check the opened clearings"); return done(); }
        )
    })

  })
 

 /*
  * DE-PREAPARE
  */
 
 describe('de-prepare test DB', function () {
   it('delete mongoDB', function (done) {
     this.timeout(7200000);
     const closeClearingCollection = mongoDB.client.db(dbName).collection('ClosedClearing');
     Rx.Observable.interval(1000)
       .mergeMap(() => Rx.Observable.defer(() => closeClearingCollection.find().toArray()))
       .filter((result) => { console.log("Waiting to close MONGO", result.length); return result.length == 6 })
       .take(1)
       .mergeMap(() => mongoDB.dropDB$())
       .subscribe(
         (evt) => console.log(`${evt}`),
         (error) => {
           console.error(`Mongo DropDB failed: ${error}`);
           return done(error);
         },
         () => { return done(); }
       );
   });
   it('stop mongo', function (done) {
     this.timeout(7200000);
     Rx.Observable.of({})
       .delay(2000)
       .mergeMap(() => mongoDB.stop$())
       .subscribe(
         (evt) => console.log(`Mongo Stop: ${evt}`),
         (error) => {
           console.error(`Mongo Stop failed: ${error}`);
           return done(error);
         },
         () => { return done(); }
       );
   });
});



});
