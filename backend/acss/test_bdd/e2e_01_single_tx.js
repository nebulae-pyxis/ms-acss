// TEST LIBS
const assert = require("assert");
const Rx = require("rxjs");
const uuidv4 = require("uuid/v4");
const expect = require("chai").expect;

//LIBS FOR TESTING
const MqttBroker = require("../bin/tools/broker/MqttBroker");
const MongoDB = require('../bin/data/MongoDB').MongoDB;



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
      this.timeout(3000);
      Object.keys(environment).forEach(envKey => {
        process.env[envKey] = environment[envKey];
        // console.log(`env var set => ${envKey}:${process.env[envKey]}`);
      });

      const eventSourcing = require('../bin//tools/EventSourcing')();
      const eventStoreService = require('../bin//services/event-store/EventStoreService')();
      mongoDB = require('../bin//data/MongoDB').singleton();
      const ClearingDA = require('../bin//data/ClearingDA');
      const SettlementDA = require('../bin//data/SettlementDA');
      const BusinessDA = require('../bin//data/BusinessDA');
      const TransactionsCursorDA = require('../bin//data/TransactionsCursorDA');
      const TransactionsDA = require('../bin//data/TransactionsDA');
      const LogErrorDA = require('../bin//data/LogErrorDA');
      const AccumulatedTransactionDA = require('../bin//data/AccumulatedTransactionDA');
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
        // graphQlService.start$()
      ).subscribe(
        (evt) => {
          console.log(evt)
        },
        (error) => {
          console.error('Failed to start', error);
          //process.exit(1);
          return done(error);
        },
        () => { console.log('acss started'); return done(); }
      );

    });

    it("start acss-channel server", function (done) {
      this.timeout(3000);


      const eventSourcing = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/tools/EventSourcing')();
      const eventStoreService = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/services/event-store/EventStoreService')();
      const mongoDB = require('../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload//bin/data/MongoDB').singleton();
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
        () => {console.log('acss-channel-afcc-reload started'); return done();}
    );

    });
    it("start MQTT broker", function (done) {
      broker = new MqttBroker({
        mqttServerUrl: process.env.MQTT_SERVER_URL,
        replyTimeout: process.env.REPLY_TIMEOUT || 2000
      });
      done();
    });
  });


  /*
  * CREATE BUSINESS UNITS
  */
 describe("Create the business units", function() {

   it("Create one busines unit", function (done) {

     Rx.Observable.from([
       { _id: "123456789_Metro_med", name: "Metro de Medellin" },
       { _id: "123456789_Gana", name: "Gana Medellin" },
       { _id: "123456789_NebulaE_POS", name: "NebulaE_POS" },
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
       .delay(1000)
       .subscribe(
         evt => console.log(`Message sent to create a business unit: ${evt}`),
         error => {
           console.error(`sent message failded ${error}`);
           return done(error);
         },
         () => {
           return done();
         });
   });

 });




  /*
  * CREATE acss-reload CHANNEL CONFIG
  */

 describe("Create the channel configuration", function() {

  it("Create one configuration", function (done) {
    this.timeout(7000);
    broker.send$('Events', '',{
      et: "ACSSConfigurationCreated",
      etv: 1,
      at: "AcssChannel",
      aid: 1,
      data: {
        id: 1,
        fareCollectors:[{
          fromBu: "123456789_Pasarela",
          buId: "123456789_Metro_med",
          percentage: 98.5
        }],
        parties:[
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
        surplusCollectors:[{
          fromBu: "123456789_Pasarela",
          buId: "123456789_surplus",
        }],
        lastEdition: Date.now()
      },
      user: "esteban.zapata",
      timestamp: Date.now(),
      av: 164
    })
    .delay(3000)
    .subscribe(
      result => console.log(result),
      error => {
        console.error(`sent message failded ${error}`);
        return done(error);
      },
      () => {
        console.log("!!!!!!!!!!!!!!!!!!!Stream finished!!!!!!!!!!!!!");
        return done();
      }
    )

  });

});

  /*
  * CREATE 1 RELOAD
  */

  describe("Create AFCC reload and check its transactions", () =>  {
    
    it("Create single AFCC reload", (done) => {
      this.timeout(1000);
      const cardId = uuidv4();
      broker.send$('Events', '', {
        et: "WalletTransactionExecuted",
        etv: 1,
        at: "Wallet",
        aid: cardId,
        data: {
          businessId:  '123456789_NebulaE_POS',
          transactionType: "SALE",
          transactionConcept: "RECARGA_CIVICA",
          transactions:[
            {
              id: uuidv4(),
              pocket: "MAIN",
              value: -11000,
              user: "juan.vendedor",
              location: {},
              notes: "notas de la recarga de 5000",
              terminal: {
                id: uuidv4(),
                userId: "juan.user_de_terminal",
                username: "JUAN.SANTA",
                associatedTransactionIds: []
              }
            }
          ]
        },
        user: "juan.santa",
        timestamp: Date.now(),
        av: 1
      })
      .subscribe(
        ok => console.log(ok),
        error => {
          console.log(error);
          return done(error);
        },
        () => { console.log("Reload made finished"); return done();  }
      )
    }),

    it('Chek all transactions amounts', (done) => {
      this.timeout(4000);
      const transactionsExpected = { 
        "123456789_Metro_med": 10835, 
        "123456789_PlaceToPay": 7.5,
        "123456789_NebulaE": 8.99, 
        "123456789_surplus": 0.01 };
      Rx.Observable.of({})
        .delay(1000)
        .mapTo(mongoDB.client.db(dbName).collection("Transactions"))
        .mergeMap((collection) => Rx.Observable.defer(() => collection.find().toArray()))
        .mergeMap(transactions => Rx.Observable.from(Object.keys(transactionsExpected))
          .map(buId => { 
            const index = transactions.findIndex(t => t.toBu == buId);
            console.log("##############",JSON.stringify(t), "#######################");
            return { match: transactions[index].amount == transactionsExpected[buId], amount: transactions[index].amount }
          })
          .toArray()
        )
        .do(results => {
          expect(results).to.be.lengthOf(5);
          expect(results).to.be.deep.equals([...Array(5)].map((e, i) => ({match: true, amount: transactionsExpected[Object.keys(transactionsExpected)[i]] })))
        })
      .subscribe(
        ok => console.log("$$$$$", ok),
        error => {
          console.log(error);
          return done(error);
        },
        () => { console.log("Reload made finished"); return done();  }
      )

    })

  });

  /** RUN THE CLEARING CRONJOB TASK */



 

   /*
  * DE-PREAPARE
  */

//  describe('de-prepare test DB', function () {
//    it('delete mongoDB', function (done) {
//      this.timeout(8000);
//      Rx.Observable.of({})
//        .delay(5000)
//        .mergeMap(() => mongoDB.dropDB$())
//        .subscribe(
//          (evt) => console.log(`${evt}`),
//          (error) => {
//            console.error(`Mongo DropDB failed: ${error}`);
//            return done(error);
//          },
//          () => { return done(); }
//        );
//    });
//    it('stop mongo', function (done) {
//      this.timeout(4000);
//      Rx.Observable.of({})
//        .delay(1000)
//        .mergeMap(() => mongoDB.stop$())
//        .subscribe(
//          (evt) => console.log(`Mongo Stop: ${evt}`),
//          (error) => {
//            console.error(`Mongo Stop failed: ${error}`);
//            return done(error);
//          },
//          () => { return done(); }
//        );
//    });
// });



});
