// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

//LIBS FOR TESTING
const MqttBroker = require('../../../bin/crosscutting/broker/MqttBroker');

//GLOABAL VARS to use between tests
let mqttBroker = {};
let payload = { a: 1, b: 2, c: 3 };


/*
NOTES:
before run please start mqtt:
  docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto  
*/

describe('MQTT BROKER', function () {
    describe('Prepare mqtt broker', function () {
        it('instance MqttBroker', function (done) {
            //ENVIRONMENT VARS
            mqttBroker = new MqttBroker({
                mqttServerUrl: 'mqtt://localhost:1883',
                replyTimeout: 2000
            });
            assert.ok(true, 'MqttBroker constructor worked');
            return done();
        });
    });
    describe('Publish and listent on MQTT', function () {
        it('Publish and recive response using send$ + getMessageReply$', function (done) {
            mqttBroker.send$('TestMqttBroker', 'TestMqttBroker', payload)
                .switchMap((sentMessageId) => Rx.Observable.forkJoin(
                    //listen for the reply
                    mqttBroker.getMessageReply$('TestMqttBrokerResponse', sentMessageId, 1800, false),

                    //send a dummy reply, but wait a litle bit before send it so the listener is ready
                    Rx.Observable.of({})
                        .delay(200)
                        .switchMap(() => mqttBroker.send$('TestMqttBrokerResponse', 'TestMqttBroker', { x: 1, y: 2, z: 3 }, { correlationId: sentMessageId }))

                )).subscribe(
                    ([response, sentResponseMessageId]) => {
                        assert.deepEqual(response, { x: 1, y: 2, z: 3 });
                    },
                    error => {
                        return done(new Error(error));
                    },
                    () => {
                        return done();
                    }
                );
        });
        it('Publish and recive response using sendAndGetReply$', function (done) {

            const messageId = uuidv4();
            mqttBroker.configMessageListener$(['TestMqttBrokerResponse']);
            Rx.Observable.forkJoin(
                //send payload and listen for the reply
                mqttBroker.sendAndGetReply$('TestMqttBroker', 'TestMqttBrokerResponse', 'TestMqttBroker', payload, 1800, false, { messageId }),
                //send a dummy reply, but wait a litle bit before send it so the listener is ready
                Rx.Observable.of({})
                    .delay(200)
                    .switchMap(() => mqttBroker.send$('TestMqttBrokerResponse', 'TestMqttBrokerResponse', { x: 1, y: 2, z: 3 }, { correlationId: messageId }))
            ).subscribe(
                ([response, sentResponseMessageId]) => {
                    assert.deepEqual(response, { x: 1, y: 2, z: 3 });
                },
                error => {
                    return done(new Error(error));
                },
                () => {
                    return done();
                }
            );
        });
        it('subscribe and wait for messges', function (done) {
            
            Rx.Observable.forkJoin(
                //send payload and listen for the reply
                mqttBroker.getMessageListener$(['TestMqttBroker'], ['Event'], false)
                    .first(),
                //send a dummy reply, but wait a litle bit before send it so the listener is ready
                Rx.Observable.of({})
                    .delay(200)
                    .switchMap(() => mqttBroker.send$( 'TestMqttBroker', 'Event', { event: 'yai' }))
            ).subscribe(
                ([event, sentEventId]) => {
                    assert.deepEqual(event, { event: 'yai' });
                },
                error => {
                    return done(new Error(error));
                },
                () => {
                    console.log('asdas')
                    return done();
                }
            );
        });
    });
    describe('de-prepare mqtt broker', function () {
        it('stop MqttBroker', function (done) {
            mqttBroker.disconnectBroker$()
                .subscribe(
                    () => {
                    },
                    error => {
                        return done(new Error(error));
                    },
                    () => {
                        assert.ok(true, 'MqttBroker stoped');
                        return done();
                    }
                );
        });
    });
});
