const eventSourcing = require('./SettlementES')();
const cqrs = require('./SettlementCQRS')();

module.exports = {
    eventSourcing,
    cqrs,
    "handleSettlementJobTriggeredEvent$": eventSourcing.handleSettlementJobTriggeredEvent$
};