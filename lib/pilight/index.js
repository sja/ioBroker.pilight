/* jshint -W097 */// jshint strict:false, esnext:true
/*jslint node: true */
"use strict";

const DeviceTypes = {
    RAW: 0,
    SWITCH: 1,
    DIMMER: 2,
    WEATHER: 3,
    RELAY: 4,
    SCREEN: 5,
    CONTACT: 6,
    PENDINGSW: 7,
    DATETIME: 8,
    XBMC: 9,
    LIRC: 10,
    WEBCAM: 11
};

const TypeRoleMap = {
    'state': {role: 'switch', type: 'boolean'},
    'battery': {role: 'indicator.battery', type: 'state'},
    'humidity': {role: 'value.humidity', type: 'state'},
    'temperature': {role: 'value.temperature', type: 'state'},
    'windgust': {role: 'value.windgust', type: 'state'},
    'winddir': {role: 'value.winddir', type: 'state'},
    'windavg': {role: 'value.windavg', type: 'state'}
};

module.exports = {
    DeviceTypes: DeviceTypes,

    /**
     *
     * @param conf
     * @return {{type: string, role: string, common: {name}, native: {}}}
     */
    createDeviceConfig: (conf) => {
        if (typeof conf.type !== 'number') {
            throw new Error('Config node had no type attribute!');
        }
        let roleName = Object.keys(DeviceTypes).find( type => DeviceTypes[type] === conf.type);

        if (!roleName) {
            console.log(`Not implemented device type ${conf.type}`);
            roleName = '';
        }

        return {
            type: 'device',
            role: roleName.toLowerCase(),
            common: {
                name: conf.devices.join('-')
            },
            native: {}
        };
    },

    /**
     * Returns array of objects which can be used to create ioBroker states.
     * @param conf
     */
    createPropertyConfig: (conf) => {
        if (typeof conf.values !== 'object') {
            throw new Error('Config node had no values attribute!');
        }
        let result = [];
        Object.keys(conf.values).forEach(function (propName) {
            if (propName === 'timestamp') return;
            let typeAndRole = TypeRoleMap[propName] || {};
            result.push({
                type: 'state',
                common: {
                    valName: propName,
                    role: typeAndRole.role,
                    type: typeAndRole.type,
                    read: true,
                    write: propName === 'state'
                },
                native: {}
            });
        });
        return result;
    },

    getConvertedValue: (device, valueId) => {
        switch (device.type) {
            case DeviceTypes.SWITCH:
            case DeviceTypes.RELAY:
                let val = device.values[valueId].toLowerCase();
                return val === 'on';
            default:
                return device.values[valueId];
        }
    }

};