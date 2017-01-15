/* jshint -W097 */// jshint strict:false
/*jslint node: true */
var expect = require('chai').expect;
var setup  = require(__dirname + '/lib/setup');

var objects = null;
var states  = null;
var onStateChanged = null;
var onObjectChanged = null;
var sendToID = 1;

const http = require('http');
const WebSocketServer = require('websocket').server;
let randomWebsocketPort;
const mockHttpServer = http
    .createServer((req, res) => {
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>GOT REQ HERE!');
        res.end();
    })
    .listen(0, 'localhost', (err) => {
        if (err) console.error(err);
        randomWebsocketPort = mockHttpServer.address().port;
        console.log('Started Mock HTTP Server on random port ' + randomWebsocketPort);
    });
const wsMockServer = new WebSocketServer({httpServer: mockHttpServer});

var adapterShortName = setup.adapterName.substring(setup.adapterName.indexOf('.')+1);

function checkConnectionOfAdapter(cb, counter) {
    counter = counter || 0;
    console.log('Try check #' + counter);
    if (counter > 30) {
        if (cb) cb('Cannot check connection');
        return;
    }

    states.getState('system.adapter.' + adapterShortName + '.0.alive', function (err, state) {
        if (err) console.error(err);
        if (state && state.val) {
            if (cb) cb();
        } else {
            setTimeout(function () {
                checkConnectionOfAdapter(cb, counter + 1);
            }, 1000);
        }
    });
}

function checkValueOfState(id, value, cb, counter) {
    counter = counter || 0;
    if (counter > 20) {
        if (cb) cb('Cannot check value Of State ' + id);
        return;
    }

    states.getState(id, function (err, state) {
        if (err) console.error(err);
        if (value === null && !state) {
            if (cb) cb();
        } else
        if (state && (value === undefined || state.val === value)) {
            if (cb) cb();
        } else {
            setTimeout(function () {
                checkValueOfState(id, value, cb, counter + 1);
            }, 500);
        }
    });
}

function sendTo(target, command, message, callback) {
    onStateChanged = function (id, state) {
        if (id === 'messagebox.system.adapter.test.0') {
            callback(state.message);
        }
    };

    states.pushMessage('system.adapter.' + target, {
        command:    command,
        message:    message,
        from:       'system.adapter.test.0',
        callback: {
            message: message,
            id:      sendToID++,
            ack:     false,
            time:    (new Date()).getTime()
        }
    });
}

describe('Test ' + adapterShortName + ' adapter', function() {
    let lastWsConnection = null;
    let lastWsMessage = null;

    wsMockServer.on('request', (req) => {
        var connection = req.accept(null, req.origin);

        if (lastWsConnection != null) {
            console.log('Connection closed by test.', lastWsConnection);
            lastWsConnection.close();
        }
        lastWsConnection = connection;

        lastWsConnection.on('message', (msg) => {
            if (msg.type === 'utf8') {
                lastWsMessage = msg.utf8Data;
            }
        });

        connection.on('close', function(connection) {
            console.log('Connection closed.');
        });

    });

    before('Test ' + adapterShortName + ' adapter: Start js-controller', function (_done) {
        this.timeout(600000); // because of first install from npm

        setup.setupController(function () {
            var config = setup.getAdapterConfig();
            // enable adapter
            config.common.enabled  = true;
            config.common.loglevel = 'debug';

            config.native.port = randomWebsocketPort;

            setup.setAdapterConfig(config.common, config.native);

            setup.startController(true, function objChange(id, obj) {}, function stateChange(id, state) {
                    if (onStateChanged) onStateChanged(id, state);
                },
                function cb(_objects, _states) {
                    objects = _objects;
                    states  = _states;
                    _done();
                });
        });
    });

    it('Test ' + adapterShortName + ' adapter: Check if adapter started', function (done) {
        this.timeout(60000);
        checkConnectionOfAdapter(function (res) {
            if (res) console.log(res);
            expect(res).not.to.be.equal('Cannot check connection');
            objects.setObject('system.adapter.test.0', {
                    common: {

                    },
                    type: 'instance'
                },
                function () {
                    states.subscribeMessage('system.adapter.test.0');
                    done();
                });
        });
    });
    
    it(`Test ${adapterShortName} adapter: Check for established websocket connection`, function () {
        expect(lastWsConnection).to.not.be.null;
        expect(lastWsMessage).to.be.equal('{"action":"request values"}');
        lastWsConnection.send('{}');
    });

    after('Test ' + adapterShortName + ' adapter: Stop js-controller', function (done) {
        this.timeout(10000);

        setup.stopController(function (normalTerminated) {
            console.log('Adapter normal terminated: ' + normalTerminated);
            if (lastWsConnection) {
                lastWsConnection.close();
            }
            wsMockServer.shutDown();
            mockHttpServer.close(() => done());
        });

    });

});
