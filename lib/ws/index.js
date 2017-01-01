/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

const WebSocketConnection = require('./WebSocketConnection');

module.exports = {
    simple : (log, options, SocketClient, SocketClientSettings) => {
        return new WebSocketConnection(log, options, SocketClient, SocketClientSettings);
    }
};