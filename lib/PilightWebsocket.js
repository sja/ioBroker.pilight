/* jshint -W097 */// jshint strict:false, esnext:true
/*jslint node: true */
"use strict";

const pilight = require('./pilight');
const webSocketUtils = require('./ws/utils');
const WebSocketConnectionFactory = require('./ws');

/**
 * pilight accessory via websocket
 */
class PilightWebsocket {

    /**
     * Required config
     *
     * Default config is: host=localhost, port=5001, device=lamp
     *
     * @param adapter
     */
    constructor(adapter) {
        this.adapter = adapter;
        this.log = adapter.log.info;

        // this.deviceState = undefined;

        this.config = {
            host: adapter.config.host || 'localhost',
            port: adapter.config.port || 5001,
            sharedWS: false
        };

        // this.id = `name=${this.config.deviceId},ws://${this.config.host}:${this.config.port}/`;
        this.connect();
    }

    disconnect() {
        if (this.connection) {
            this.connection.disconnect(() => {
                this.connection = null;
            });
        }
    }

    connect() {
        const pilightSocketAddress = `ws://${this.config.host}:${this.config.port}/`;
        const connection = WebSocketConnectionFactory.simple(this.log, {address: pilightSocketAddress});

        this.log(`Option sharedWS = ${this.config.sharedWS}`);

        this.connection = connection;
        connection.connect();

        connection.emitter.on('connection::error', (error) => {
            this.log(`Connection error: ${error.message}`);
        });

        connection.emitter.on('connection::create', () => {
            // initial request all available values
            this.log(`Requesting initial states...`);
            connection.send({action: 'request values'});
        });

        connection.emitter.on('message::receive', (body) => {
            this.handleMessage(body);
        });

        connection.emitter.on('message::error', (error) => {
            this.log(`Something went wrong, cannot parse message. Error: ${error.toString()}`);
        });
    }

    /**
     * TODO: devices is an array, join it with '-' to get unique name. Why array there?
     * @param json
     */
    handleMessage(json) {
        if (webSocketUtils.isMessageOfTypeValues(json)) {
            this.handleValuesObject(json);
        } else if (webSocketUtils.isMessageOfTypeUpdate(json)) {
            let deviceId = json.devices.join('-');
            let valueIds = Object.keys(json.values).filter(val => val !== 'timestamp');
            valueIds.forEach(function (valueId) {
                this.adapter.setState(`${deviceId}.${valueId}`, {
                    val: pilight.getConvertedValue(json, valueId),
                    ack: true,
                    ts: json.values.timestamp
                });
            }, this);
        }
    }

    /**
     * Setup devices and states in ioBroker.
     * @param config WebSocket message after 'request values'.
     */
    handleValuesObject(config) {
        if (config.length <= 0) {
            this.log('No devices in pilight.');
            return;
        }

        const log = this.log;
        const adapter = this.adapter;

        for (let device of config) {

            let devConfig = pilight.createDeviceConfig(device);
            let deviceId = devConfig.common.name;

            log('Creating device ' + deviceId);

            adapter.setObjectNotExists(deviceId, devConfig, function (err) {
                if (err) {
                    log(err);
                    return;
                }

                let config = pilight.createPropertyConfig(device);

                config.forEach(function (stateConfig) {
                    let valueId = stateConfig.common.valName;
                    let stateId = `${deviceId}.${valueId}`;

                    log('Creating state ' + stateId);

                    adapter.setObjectNotExists(stateId, stateConfig, function (err) {
                        if (err) {
                            log(err);
                            return;
                        }

                        let value = pilight.getConvertedValue(device, valueId);

                        adapter.setState(stateId, {
                            val: value,
                            ack: true,
                            ts: device.values.timestamp
                        });
                    });
                });


            });

        }


    }

    setPowerState(deviceId, powerOn, callback) {
        if (!this.connection) {
            callback(new Error('No connection'));
        } else {
            let state = powerOn ? 'on' : 'off';
            this.log(`Try to set powerstate to "${state}"`);
            this.connection.send({
                action: 'control',
                code: {device: deviceId, state}
            });
            callback(null);
        }
    }

}

module.exports = PilightWebsocket;