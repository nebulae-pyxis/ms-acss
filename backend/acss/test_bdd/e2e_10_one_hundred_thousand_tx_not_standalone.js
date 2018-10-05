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

const dbName = `acss`;

const environment = {
  NODE_ENV: "production",
  BROKER_TYPE: "MQTT",
  REPLY_TIMEOUT: 2000,
  GATEWAY_REPLIES_TOPIC_SUBSCRIPTION: "gateway-replies-topic-mbe-acss",
  MQTT_SERVER_URL: "mqtt://192.168.188.147:1883",
  MONGODB_URL: "mongodb://192.168.188.147:27017,192.168.188.147:27018,192.168.188.147:27019?replicaSet=rs0",
  MONGODB_DB_NAME: dbName ,
  MONGODB_ACSS_DB_NAME: dbName ,
  JWT_PUBLIC_KEY:
    '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6XkGwOK3LrYdtw8BFYGSOp2TSJl7mHE0NIYuzN9LFDj0IxEc46ddmDZFaQJB91PRQKDq4Z2qzcJE3thYj8nTDPiQ4hQMFm5zF6QjPWBqBMMqyaxBK/iXJ8zaf9lD8eRqsZxI6URE5ZILx74ZQmh7lo46/iVXORJNaG159wWU8yNfsL1n63+WKL40mxNjEyu3kI/vvrJYDJG+/N6CrWPH8yYFJxfWDHrZBHl/kW+QrX1OnbI/mybb1r0wnzasnYUgk5k+sRCLV92FPv6NaxUPSO4zk5kkVD6RQ2m0kv+ynzYAx6Ou1Z/khz/Y7OuP0p/PBAyFAu2HAh3rClRB6nTfnwIDAQAB\n-----END PUBLIC KEY-----',
  EVENT_STORE_BROKER_TYPE: "MQTT",
  EVENT_STORE_BROKER_EVENTS_TOPIC: "Events",
  EVENT_STORE_BROKER_URL: "mqtt://192.168.188.147:1883",
  EVENT_STORE_STORE_TYPE: "MONGO",
  EVENT_STORE_STORE_URL: "mongodb://192.168.188.147:27017,192.168.188.147:27018,192.168.188.147:27019?replicaSet=rs0",
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
  describe("Prepare DB", function () {
    it("start acss server", function (done) {
      this.timeout(30000);
      Object.keys(environment).forEach(envKey => {
        process.env[envKey] = environment[envKey];
        // console.log(`env var set => ${envKey}:${process.env[envKey]}`);
      });
      
      mongoDB = require('../bin/data/MongoDB').singleton();
      // const graphQlService = require('../bin//services/gateway/GraphQlService')();

      Rx.Observable.concat(
        mongoDB.start$(),
      ).subscribe(
        (evt) => {
          // stepCollection = mongoDB.client.db(dbName).collection('steps');
         },
        (error) => {console.error(error); return done(error); },
        () => { console.log('[[################ 01 ################]] ACSS STARTED'); return done(); }
      );

    }),
    it("start MQTT connection", function (done) {      
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
      const amount_7K = 7000;
      const amount_12K = 12000;
      const amount_13K = 13000;
      const amount_4K = 4000;
      const amount_5K = 5000;
      const amount_11K = 11000;
      const amount_1_5K = 1500;
      const amount_1_8K = 1800;
      const amount_6_5K = 6500;
      const amount_3_5K = 3500;


      const nebulaReloader = '123456789_NebulaE_POS';
      const ganaReloader = '123456789_Gana';
      /**
       * 
       * @param {number} qty quantity of times to send the reload} 
       * @param {number} amount Reload amount
       * @param {string} buId Business unit who create the reload
       * @param {number} delay  delay between each event emition
       */
      const reloadsEmitter = function(qty, amount, buId, delay = 0){
        const cardId = uuidv4();
        return Rx.Observable.range(0, qty)
        .concatMap((i) => broker.send$('Events', '', {
          _id: uuidv4(),
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
        .do(() => console.log(`${buId.replace('123456789_', '')} Sending Reload by ${amount}, ${i} of ${qty}`))
        .delay(delay)
      )
      }

      Rx.Observable.concat(
        reloadsEmitter(1, amount_7K, nebulaReloader).delay(1000),
        Rx.Observable.forkJoin(
          reloadsEmitter(4999, amount_7K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_7K, ganaReloader, 200),
          reloadsEmitter(5000, amount_12K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_12K, ganaReloader, 200),
          reloadsEmitter(5000, amount_13K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_13K, ganaReloader, 200),
          reloadsEmitter(5000, amount_4K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_4K, ganaReloader, 200),
          reloadsEmitter(5000, amount_5K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_5K, ganaReloader, 200),
          reloadsEmitter(5000, amount_11K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_11K, ganaReloader, 200),
          reloadsEmitter(5000, amount_1_5K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_1_5K, ganaReloader, 200),
          reloadsEmitter(5000, amount_1_8K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_1_8K, ganaReloader, 200),
          reloadsEmitter(5000, amount_6_5K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_6_5K, ganaReloader, 200),
          reloadsEmitter(5000, amount_3_5K, nebulaReloader, 200),
          reloadsEmitter(5000, amount_3_5K, ganaReloader, 200)
        )
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
        "123456789_Metro_med": 643205000,
        "123456789_Gana": 3918000,
        "123456789_NebulaE_POS": 4407750, 
        "123456789_PlaceToPay": 668050,
        "123456789_NebulaE": 800400,
        "123456789_surplus": 800,
        "total": 653000000
      };

      const collection = mongoDB.client.db(dbName).collection('Transactions');
      const expectedTransactions = 96;
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
            accumulatedTransactions[tr.toBu] += tr.amount * 1000;
            // switch (tr.toBu) {
            //   case "123456789_Metro_med"  : {
            //     expect([6895, 11820, 12805, 3940, 4925, 10835, 1477.5, 1773, 6402.5, 3447.5]).to.include(tr.amount);
            //     break;
            //   }
            //   case "123456789_NebulaE_POS": {
            //     expect([94.5, 162, 175.5, 54, 67.5, 148.5, 20.25, 24.3, 87.75, 47.25]).to.include(tr.amount);
            //     break;
            //   }
            //   case "123456789_Gana": {
            //     expect([84, 144, 156, 48, 60, 132, 18, 21.6, 78, 42]).to.include(tr.amount);
            //     break;
            //   }
            //   case "123456789_PlaceToPay": {
            //     // when NebulaE sells the reload
            //     const toPlaceWhenNebulaSells = [4.77, 8.19, 8.87, 2.73, 3.41, 0.68, 1.02, 1.22, 4.43, 2.38];
            //     // when Gana Sells the reload
            //     const toPlaceWhenGanaSells = [9.55, 16.37, 17.74, 5.45, 6.82, 1.36, 2.04, 2.45, 8.87, 4.77]
            //     expect([...toPlaceWhenNebulaSells, ...toPlaceWhenGanaSells]).to.include(tr.amount);
            //     break;
            //   }
            //   case "123456789_NebulaE": {
            //     // when NebulaE sells the reload
            //     const toNebulaWhenNebulaSells = [5.72, 9.81, 10.62, 3.27, 4.08, 0.81, 1.22, 1.47, 5.31, 2.86];
            //     // when Gana Sells the reload
            //     const toNebulaWhenGanaSells = [11.44, 19.61, 21.25, 6.53, 8.17, 1.63, 2.45, 2.94, 10.62, 5.72];
            //     expect([...toNebulaWhenNebulaSells, ...toNebulaWhenGanaSells]).to.include(tr.amount);
            //     break;
            //   }
            //   case '123456789_surplus': {
            //     expect(tr.amount).to.be.equal(0.01)
            //     break;
            //   }
            //   default: { expect(1).to.be.equals(0); }
              
            // }
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
      const acumulatedTransactionAmountExpected = 653000000;
      const transactionsExpected = { 
        "123456789_Metro_med": 643205000,
        "123456789_Gana": 3918000,
        "123456789_NebulaE_POS": 4407750, 
        "123456789_PlaceToPay": 668050,
        "123456789_NebulaE": 800400,
        "123456789_surplus": 800
      };
      const AccTransactionsCollection = mongoDB.client.db(dbName).collection("AccumulatedTransactions"); 

      Rx.Observable.interval(1000)
        .mergeMap(() => Rx.Observable.defer(() => AccTransactionsCollection.find().toArray()))
        .filter(accTransactions => {
          console.log("Waiting for accumulated transactions... ", accTransactions.length )
          return accTransactions.length >= Object.keys(transactionsExpected).length
        })
        .take(1)
        .delay(3000)
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
        "123456789_Metro_med": 643205000,
        "123456789_Gana": 3918000,
        "123456789_NebulaE_POS": 4407750, 
        "123456789_PlaceToPay": 668050,
        "123456789_NebulaE": 800400,
        "123456789_surplus": 800
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
        "123456789_Metro_med": 643205000,
        "123456789_Gana": 3918000,
        "123456789_NebulaE_POS": 4407750, 
        "123456789_PlaceToPay": 668050,
        "123456789_NebulaE": 800400,
        "123456789_surplus": 800
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

//  describe('de-prepare test DB', function () {
//    it('delete mongoDB', function (done) {
//      this.timeout(7200000);
//      const closeClearingCollection = mongoDB.client.db(dbName).collection('ClosedClearing');
//      Rx.Observable.interval(1000)
//        .mergeMap(() => Rx.Observable.defer(() => closeClearingCollection.find().toArray()))
//        .filter((result) => { console.log("Waiting to close MONGO", result.length); return result.length == 6 })
//        .take(1)
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
//      this.timeout(7200000);
//      Rx.Observable.of({})
//        .delay(2000)
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
