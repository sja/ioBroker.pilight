/* jshint -W097 */// jshint strict:false, esnext:true
/*jslint node: true */
"use strict";

const PilightWebsocket = require('./lib/PilightWebsocket');

const ioBrokerUtils = require(__dirname + '/lib/utils'); // Get common adapter utils

const adapter = ioBrokerUtils.adapter('pilight');

let pilightWebsocket = null;

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        if (pilightWebsocket) {
            pilightWebsocket.c
        }
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    // adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // id = pilight.0.Plug1.state
    let deviceId = id.split('.')[2];

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        adapter.log.info('ack is not set!');
        pilightWebsocket.setPowerState(deviceId, state.val, function (err) {
            if (err) adapter.log(err);
        });
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    pilightWebsocket = new PilightWebsocket(adapter);
    adapter.subscribeStates('*');
});


