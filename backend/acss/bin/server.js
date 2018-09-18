'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const eventSourcing = require('./tools/EventSourcing')();
const eventStoreService = require('./services/event-store/EventStoreService')();
const mongoDB = require('./data/MongoDB').singleton();
const ClearingDA = require('./data/ClearingDA');
const BusinessDA = require('./data/BusinessDA');
const TransactionsCursorDA = require('./data/TransactionsCursorDA');
const TransactionsDA = require('./data/TransactionsDA');
const AccumulatedTransactionDA = require('./data/AccumulatedTransactionDA');
const graphQlService = require('./services/gateway/GraphQlService')();
const Rx = require('rxjs');

const start = () => {
    Rx.Observable.concat(
        eventSourcing.eventStore.start$(),
        eventStoreService.start$(),
        mongoDB.start$(),
        BusinessDA.start$(),
        ClearingDA.start$(),
        TransactionsCursorDA.start$(),
        TransactionsDA.start$(),
        AccumulatedTransactionDA.start$(),
        graphQlService.start$()
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



