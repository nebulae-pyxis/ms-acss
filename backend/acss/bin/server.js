'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const eventSourcing = require('./tools/EventSourcing')();
const eventStoreService = require('./services/event-store/EventStoreService')();
const mongoDB = require('./data/MongoDB').singleton();
const ClearingDA = require('./data/ClearingDA');
const SettlementDA = require('./data/SettlementDA');
const BusinessDA = require('./data/BusinessDA');
const TransactionsCursorDA = require('./data/TransactionsCursorDA');
const TransactionsDA = require('./data/TransactionsDA');
const LogErrorDA = require('./data/LogErrorDA');
const AccumulatedTransactionDA = require('./data/AccumulatedTransactionDA');
const graphQlService = require('./services/gateway/GraphQlService')();
const settlement = require("./domain/settlement/");
const Rx = require('rxjs');

const start = () => {
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
        graphQlService.start$(),
        settlement.eventSourcing.start$(),
    ).subscribe(
        (evt) => {
            console.log(evt)
        },
        (error) => {
            console.error('Failed to start', error);
            process.exit(1);
        },
        () => console.log('acss started')
    );
};

start();



