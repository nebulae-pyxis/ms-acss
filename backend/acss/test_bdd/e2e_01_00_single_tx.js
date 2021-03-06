/**
 * ITS GONNA TEST  SALES USING DIFFERENTS POCKETS MAIN, BONUS AND CREDIT POCKET
 * GENERATING BONUS FOR POS   ==>   NOT
 * POW_OWNER HAVE POS MANAGER ==>   NOT
 */

// TEST LIBS
const assert = require("assert");
const Rx = require("rxjs");
const uuidv4 = require("uuid/v4");
const expect = require("chai").expect;

//LIBS FOR TESTING
const MqttBroker = require("../bin/tools/broker/MqttBroker");
const MongoDB = require("../bin/data/MongoDB").MongoDB;
const NumberDecimal = require("mongodb").Decimal128;

let mongoDB = undefined;
let broker = undefined;

const dbName = `test-${uuidv4()
  .toString()
  .slice(0, 5)}-acss`;
// const dbName = `acss`;

const environment = {
  NODE_ENV: "production",
  BROKER_TYPE: "MQTT",
  REPLY_TIMEOUT: 2000,
  GATEWAY_REPLIES_TOPIC_SUBSCRIPTION: "emi-gateway-replies-topic-mbe-acss",
  MQTT_SERVER_URL: "mqtt://localhost:1883",
  MONGODB_URL:
    "mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs0",
  MONGODB_DB_NAME: dbName,
  MONGODB_ACSS_DB_NAME: dbName,
  JWT_PUBLIC_KEY:
    "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6XkGwOK3LrYdtw8BFYGSOp2TSJl7mHE0NIYuzN9LFDj0IxEc46ddmDZFaQJB91PRQKDq4Z2qzcJE3thYj8nTDPiQ4hQMFm5zF6QjPWBqBMMqyaxBK/iXJ8zaf9lD8eRqsZxI6URE5ZILx74ZQmh7lo46/iVXORJNaG159wWU8yNfsL1n63+WKL40mxNjEyu3kI/vvrJYDJG+/N6CrWPH8yYFJxfWDHrZBHl/kW+QrX1OnbI/mybb1r0wnzasnYUgk5k+sRCLV92FPv6NaxUPSO4zk5kkVD6RQ2m0kv+ynzYAx6Ou1Z/khz/Y7OuP0p/PBAyFAu2HAh3rClRB6nTfnwIDAQAB\n-----END PUBLIC KEY-----",
  EVENT_STORE_BROKER_TYPE: "MQTT",
  EVENT_STORE_BROKER_EVENTS_TOPIC: "Events",
  EVENT_STORE_BROKER_URL: "mqtt://localhost:1883",
  EVENT_STORE_STORE_TYPE: "MONGO",
  EVENT_STORE_STORE_URL:
    "mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs0",
  EVENT_STORE_STORE_AGGREGATES_DB_NAME: "Aggregates",
  EVENT_STORE_STORE_EVENTSTORE_DB_NAME: "EventStore",
  CHANNEL_TRANSACTION_TYPES_CONCEPTS: '{"SALE": ["RECARGA_CIVICA"]}'
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
  describe("Prepare test DB and backends", function() {
    it("start acss server", function(done) {
      this.timeout(3000);
      Object.keys(environment).forEach(envKey => {
        process.env[envKey] = environment[envKey];
        // console.log(`env var set => ${envKey}:${process.env[envKey]}`);
      });

      const eventSourcing = require("../bin/tools/EventSourcing")();
      const eventStoreService = require("../bin/services/event-store/EventStoreService")();
      mongoDB = require("../bin/data/MongoDB").singleton();
      const ClearingDA = require("../bin/data/ClearingDA");
      const SettlementDA = require("../bin/data/SettlementDA");
      const BusinessDA = require("../bin/data/BusinessDA");
      const TransactionsCursorDA = require("../bin/data/TransactionsCursorDA");
      const TransactionsDA = require("../bin/data/TransactionsDA");
      const LogErrorDA = require("../bin/data/LogErrorDA");
      const AccumulatedTransactionDA = require("../bin/data/AccumulatedTransactionDA");

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
        AccumulatedTransactionDA.start$()
        // graphQlService.start$()
      ).subscribe(
        evt => console.log(evt),
        error => {
          console.error("Failed to start", error);
          //process.exit(1);
          return done(error);
        },
        () => {
          console.log("acss started");
          return done();
        }
      );
    });

    it("start acss-channel server", function(done) {
      this.timeout(3000);

      const eventSourcing = require("../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/tools/EventSourcing")();
      const eventStoreService = require("../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/services/event-store/EventStoreService")();
      const mongoDB = require("../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/MongoDB").singleton();
      const AfccReloadChannelDA = require("../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/AfccReloadChannelDA");
      const AfccReloadsDA = require("../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/AfccReloadsDA");
      const TransactionsDA = require("../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/TransactionsDA");
      const TransactionsErrorsDA = require("../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/TransactionsErrorsDA");
      const BusinessDA = require("../../../../ms-acss-channel-afcc-reload/backend/acss-channel-afcc-reload/bin/data/businessUnitDA");
      const Rx = require("rxjs");

      Rx.Observable.concat(
        eventSourcing.eventStore.start$(),
        eventStoreService.start$(),
        mongoDB.start$(),
        Rx.Observable.forkJoin(
          AfccReloadChannelDA.start$(),
          AfccReloadsDA.start$(),
          TransactionsDA.start$(),
          TransactionsErrorsDA.start$(),
          BusinessDA.start$()
        )
      ).subscribe(evt => {}, error => done(error), () => done());
    });

    it("start MQTT broker", function(done) {
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
    it("Create one busines unit", function(done) {
      Rx.Observable.from([
        { _id: "123456789_Metro_med", name: "Metro de Medellin" },
        { _id: "123456789_Gana", name: "Gana Medellin" },
        { _id: "123456789_NebulaE_POS", name: "NebulaE_POS" },
        { _id: "123456789_PlaceToPay", name: "Place To Pay" },
        { _id: "123456789_NebulaE", name: "NebulaE" },
        { _id: "123456789_Cloud", name: "Nebula Cloud" },
        { _id: "123456789_Comisiones", name: "Comisiones nebula" },
        { _id: "123456789_inversiones", name: "Inversiones nebula" },
        { _id: "123456789_surplus", name: "surplus collector" },
        { _id: "123456789_Pasarela", name: "Pasarela" },
        { _id: "123456789_Rene", name: "Agente Rene" }
      ])
        .delay(10)
        .mergeMap(bu =>
          broker.send$("Events", "", {
            et: "BusinessCreated",
            etv: 1,
            at: "Business",
            aid: bu._id,
            data: { generalInfo: bu, _id: bu._id },
            user: "esteban.zapata",
            timestamp: Date.now(),
            av: 164
          })
        )
        .toArray()
        .delay(1000)
        .subscribe(evt => {}, error => done(error), () => done());
    });
  });

  /*
   * CREATE acss-reload CHANNEL CONFIG
   */

  describe("Create the channel configuration", function() {
    it("Create one configuration", function(done) {
      this.timeout(7000);
      broker
        .send$("Events", "", {
          et: "ACSSConfigurationCreated",
          etv: 1,
          at: "AcssChannel",
          aid: 1,
          data: {
            id: 1,
            lastEdition: Date.now(),
            salesWithMainPocket: {
              actors: [
                {
                  fromBu: "123456789_Pasarela",
                  buId: "123456789_Metro_med",
                  percentage: 98.5
                },
                {
                  fromBu: "123456789_Pasarela",
                  buId: "123456789_PlaceToPay",
                  percentage: 0.2
                },
                {
                  fromBu: "123456789_Pasarela",
                  buId: "123456789_NebulaE",
                  percentage: 0.2
                },
                {
                  fromBu: "123456789_Pasarela",
                  buId: "123456789_Cloud",
                  percentage: 0.1
                }
              ],
              surplusCollector: {
                fromBu: "123456789_Pasarela",
                buId: "123456789_surplus"
              },
              bonusCollector: {
                fromBu: "123456789_Pasarela",
                buId: "123456789_Comisiones"
              }
            },
            salesWithBonusPocket: {
              actors: [
                {
                  fromBu: "123456789_Comisiones",
                  buId: "123456789_Metro_med",
                  percentage: 98.5
                },
                {
                  fromBu: "123456789_Comisiones",
                  buId: "123456789_PlaceToPay",
                  percentage: 0.2
                },
                {
                  fromBu: "123456789_Comisiones",
                  buId: "123456789_NebulaE",
                  percentage: 0.2
                },
                {
                  fromBu: "123456789_Pasarela",
                  buId: "123456789_Cloud",
                  percentage: 0.1
                }
              ],
              investmentCollector: {
                fromBu: "123456789_Comisiones",
                buId: "123456789_inversiones"
              }
            },
            salesWithCreditPocket: {
              actors: [
                {
                  fromBu: "123456789_inversiones",
                  buId: "123456789_Metro_med",
                  percentage: 98.5
                },
                {
                  fromBu: "123456789_inversiones",
                  buId: "123456789_PlaceToPay",
                  percentage: 0.2
                },
                {
                  fromBu: "123456789_inversiones",
                  buId: "123456789_NebulaE",
                  percentage: 0.2
                },
                {
                  fromBu: "123456789_inversiones",
                  buId: "123456789_Cloud",
                  percentage: 0.1
                }
              ],
              bonusCollector: {
                fromBu: "123456789_inversiones",
                buId: "123456789_Comisiones"
              }
            }
          },
          user: "juan.santa",
          timestamp: Date.now(),
          av: 0
        })
        .delay(3000)
        .subscribe(result => {}, error => done(error), () => done());
    });
  });

  /*
   * CREATE 1 RELOAD WITHOUT BONUS
   */

  describe("Create AFCC reload and check its transactions", () => {
    it("Create single AFCC reload without bonus", done => {
      this.timeout(1000);
      const cardId = uuidv4();
      broker
        .send$("Events", "", {
          _id: uuidv4(),
          et: "WalletTransactionExecuted",
          etv: 1,
          at: "Wallet",
          aid: cardId,
          data: {
            businessId: "123456789_NebulaE_POS",
            transactionType: "SALE",
            transactionConcept: "RECARGA_CIVICA",
            transactions: [
              {
                id: uuidv4(),
                pocket: "MAIN",
                pocketAlias: "MAIN",
                value: -12500,
                user: "juan.vendedor",
                location: {},
                notes: "notas de la recarga de 11000",
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
        .subscribe(ok => {}, error => done(error), () => done());
    });

    it("Chek all transactions amounts", done => {
      this.timeout(4000);
      const transactionsExpected = {
        "123456789_Metro_med": 12312.5,
        "123456789_PlaceToPay": 25,
        "123456789_NebulaE": 25,
        "123456789_Cloud": 12.5,
        "123456789_surplus": 125
      };
      Rx.Observable.of({})
        .delay(1000)
        .mapTo(mongoDB.client.db(dbName).collection("Transactions"))
        .mergeMap(collection =>
          Rx.Observable.defer(() => collection.find().toArray())
        )
        .mergeMap(transactions =>
          Rx.Observable.from(transactions)
            .map(tx => ({
              ...tx,
              amount: parseFloat(new NumberDecimal(tx.amount.bytes).toString())
            }))
            .toArray()
        )
        .mergeMap(transactions =>
          Rx.Observable.from(Object.keys(transactionsExpected))
            .map(buId => {
              const index = transactions.findIndex(t => t.toBu == buId);
              return {
                match: transactions[index].amount == transactionsExpected[buId],
                amount: transactions[index].amount
              };
            })
            .toArray()
        )
        .do(results => {
          expect(results).to.be.lengthOf(5);
          expect(results).to.be.deep.equals(
            [...Array(5)].map((e, i) => ({
              match: true,
              amount: transactionsExpected[Object.keys(transactionsExpected)[i]]
            }))
          );
        })
        .subscribe(
          ok => {},
          error => {
            console.log(error);
            return done(error);
          },
          () => done()
        );
    });
  });

  /**
   * Drop transactions and reloads documents
   */
  describe("drop transactions tables", () => {
    it("drop tables", done => {
      this.timeout(5000);

      Rx.Observable.of({
        transactionsCollection: mongoDB.client
          .db(dbName)
          .collection("Transactions"),
        reloadsCollection: mongoDB.client
          .db(dbName)
          .collection("AfccReloadEvents")
      })
        .mergeMap(({ transactionsCollection, reloadsCollection }) =>
          Rx.Observable.forkJoin(
            Rx.Observable.defer(() => transactionsCollection.drop()),
            Rx.Observable.defer(() => reloadsCollection.drop())
          )
        )
        .subscribe(ok => {}, error => console.log(error), () => done());
    });
  });

  /**
   * Send events with no allowed transaction type, concepts.
   */
  describe("Send Executeed transactions not allowed", () => {
    //   // No allowed transaction type
    it("Send Transaction executed without allowed transaction type", done => {
      this.timeout(1000);
      const cardId = uuidv4();
      broker
        .send$("Events", "", {
          _id: uuidv4(),
          et: "WalletTransactionExecuted",
          etv: 1,
          at: "Wallet",
          aid: cardId,
          data: {
            businessId: "123456789_NebulaE_POS",
            transactionType: "SALE_PLUS",
            transactionConcept: "RECARGA_CIVICA",
            transactions: [
              {
                id: uuidv4(),
                pocket: "MAIN",
                value: -11000,
                user: "juan.vendedor",
                location: {},
                notes: "notas de la recarga de 11000",
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
          ok => {},
          error => {
            console.log(error);
            return done(error);
          },
          () => {
            console.log("Reload made finished");
            return done();
          }
        );
    });

    // No allowed transaction concept
    it("Send Transaction executed without allowed transaction concept", done => {
      this.timeout(1000);
      const cardId = uuidv4();
      broker
        .send$("Events", "", {
          _id: uuidv4(),
          et: "WalletTransactionExecuted",
          etv: 1,
          at: "Wallet",
          aid: cardId,
          data: {
            businessId: "123456789_NebulaE_POS",
            transactionType: "SALE",
            transactionConcept: "RECARGA_CIVICA_COMERCIO",
            transactions: [
              {
                id: uuidv4(),
                pocket: "MAIN",
                value: -11000,
                user: "juan.vendedor",
                location: {},
                notes: "notas de la recarga de 11000",
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
          ok => {},
          error => {
            console.log(error);
            return done(error);
          },
          () => {
            console.log("Reload made finished");
            return done();
          }
        );
    });

    it("CHECK THAT THERE AREN'T TRANSACTIONS", done => {
      this.timeout(4000);
      Rx.Observable.of({})
        .delay(1000)
        .mapTo(mongoDB.client.db(dbName).collection("Transactions"))
        .mergeMap(collection =>
          Rx.Observable.defer(() => collection.find().toArray())
        )
        .do(results => {
          expect(results).to.be.lengthOf(0);
        })
        .subscribe(ok => { }, error => done(error), () => done());
    });


    // SEND SALES MADE WITH BONUS POCKET
    it("Send Transaction executed with only  bonus pocket used", done => {
      this.timeout(1000);
      const cardId = uuidv4();
      broker
        .send$("Events", "", {
          _id: uuidv4(),
          et: "WalletTransactionExecuted",
          etv: 1,
          at: "Wallet",
          aid: cardId,
          data: {
            businessId: "123456789_NebulaE_POS",
            transactionType: "SALE",
            transactionConcept: "RECARGA_CIVICA",
            transactions: [
              {
                id: uuidv4(),
                pocket: "BONUS",
                pocketAlias: "BONUS",
                value: -5200,
                user: "juan.vendedor",
                location: {},
                notes: "notas de la recarga de 11000",
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
        .subscribe(ok => {}, error => done(error), () => done());
    });

    it("Chek all transactions amounts", done => {
      this.timeout(4000);

      const transactionsExpected = {
        "123456789_Metro_med": 5122,
        "123456789_PlaceToPay": 10.4,
        "123456789_NebulaE": 10.4,
        "123456789_Cloud": 5.2,
        "123456789_inversiones": 52
      };

      Rx.Observable.of({})
        .delay(1000)
        .mapTo(mongoDB.client.db(dbName).collection("Transactions"))
        .mergeMap(collection =>
          Rx.Observable.defer(() => collection.find().toArray())
        )
        .mergeMap(transactions =>
          Rx.Observable.from(transactions)
            .map(tx => ({
              ...tx,
              amount: parseFloat(new NumberDecimal(tx.amount.bytes).toString())
            }))
            .toArray()
        )
        .mergeMap(transactions =>
          Rx.Observable.from(Object.keys(transactionsExpected))
            .map(buId => {
              const index = transactions.findIndex(t => t.toBu == buId);
              console.log(buId, index);
              return {
                match: transactions[index].amount == transactionsExpected[buId],
                amount: transactions[index].amount
              };
            })
            .toArray()
        )
        .do(results => {
          expect(results).to.be.lengthOf(5);
          expect(results).to.be.deep.equals(
            [...Array(5)].map((e, i) => ({
              match: true,
              amount: transactionsExpected[Object.keys(transactionsExpected)[i]]
            }))
          );
        })

        .subscribe(ok => {}, error => done(error), () => done());
    });

  });

  /**
   * Drop transactions and reloads documents
   */
  describe("drop transactions tables", () => {
    it("drop tables", done => {
      this.timeout(5000);
      Rx.Observable.of({
        transactionsCollection: mongoDB.client
          .db(dbName)
          .collection("Transactions"),
        reloadsCollection: mongoDB.client
          .db(dbName)
          .collection("AfccReloadEvents")
      })
        .mergeMap(({ transactionsCollection, reloadsCollection }) =>
          Rx.Observable.forkJoin(
            Rx.Observable.defer(() => transactionsCollection.drop()),
            Rx.Observable.defer(() => reloadsCollection.drop())
          )
        )
        .delay(1000)
        .mapTo(mongoDB.client.db(dbName).collection("Transactions"))
        .mergeMap(collection =>
          Rx.Observable.defer(() => collection.find().toArray())
        )
        .do(results => {
          expect(results).to.be.lengthOf(0);
        })
        .subscribe(ok => {}, error => console.log(error), () => done());
    });
  });


  describe("Make the reloads with credit pocket", () => {
    // SEND SALES MADE WITH CREDIT POCKET
    it("Send Transaction executed with only  bonus pocket used", done => {
      this.timeout(1000);
      const cardId = uuidv4();
      broker.send$("Events", "", {
        _id: uuidv4(),
        et: "WalletTransactionExecuted",
        etv: 1,
        at: "Wallet",
        aid: cardId,
        data: {
          businessId: "123456789_NebulaE_POS",
          transactionType: "SALE",
          transactionConcept: "RECARGA_CIVICA",
          transactions: [
            {
              id: uuidv4(),
              pocket: "MAIN",
              pocketAlias: "CREDIT",
              value: -7250,
              user: "juan.vendedor",
              location: {},
              notes: "notas de la recarga de 11000",
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
        .subscribe(ok => { }, error => done(error), () => done());
    });

    it("Chek all transactions amounts", done => {
      this.timeout(4000);
      const transactionsExpected = {
        "123456789_Metro_med": 7141.25,
        "123456789_PlaceToPay": 14.5,
        "123456789_NebulaE": 14.5,
        "123456789_Cloud": 7.25
      };

      Rx.Observable.of({})
        .delay(1000)
        .mapTo(mongoDB.client.db(dbName).collection("Transactions"))
        .mergeMap(collection =>
          Rx.Observable.defer(() => collection.find().toArray())
        )
        .mergeMap(transactions =>
          Rx.Observable.from(transactions)
            .map(tx => ({
              ...tx,
              amount: parseFloat(new NumberDecimal(tx.amount.bytes).toString())
            }))
            .toArray()
        )
        .do(transactions => {
          expect(transactions).to.be.lengthOf(4);
        })
        .mergeMap(transactions =>
          Rx.Observable.from(Object.keys(transactionsExpected))
            .map(buId => {
              const index = transactions.findIndex(t => t.toBu == buId);
              console.log("##########", buId, index);
              console.log(transactions);
              return {
                match: transactions[index].amount == transactionsExpected[buId],
                amount: transactions[index].amount
              };
            })
            .toArray()
        )
        .do(results => {
          expect(results).to.be.lengthOf(4);
          expect(results).to.be.deep.equals(
            [...Array(4)].map((e, i) => ({
              match: true,
              amount: transactionsExpected[Object.keys(transactionsExpected)[i]]
            }))
          );
        })

        .subscribe(ok => { }, error => done(error), () => done());
    });
  });







  /*
   * DE-PREAPARE
   */

  describe("de-prepare test DB", function() {
    it("delete mongoDB", function(done) {
      this.timeout(8000);
      Rx.Observable.of({})
        .delay(5000)
        .mergeMap(() => mongoDB.dropDB$())
        .subscribe(
          evt => console.log(`${evt}`),
          error => {
            console.error(`Mongo DropDB failed: ${error}`);
            return done(error);
          },
          () => {
            return done();
          }
        );
    });
    it("stop mongo", function(done) {
      this.timeout(4000);
      Rx.Observable.of({})
        .delay(1000)
        .mergeMap(() => mongoDB.stop$())
        .subscribe(
          evt => console.log(`Mongo Stop: ${evt}`),
          error => {
            console.error(`Mongo Stop failed: ${error}`);
            return done(error);
          },
          () => {
            return done();
          }
        );
    });
  });
});
