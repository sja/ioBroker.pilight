/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

/**
 * Internal helper
 */
class Utils {

    /**
     * Returns promise asserting the input message contains UTF8.
     * @param message
     * @returns {Promise}
     */
    assertUtf8Message(message) {
        return new Promise((resolve, reject) => {
            if (message.type === 'utf8') {
                resolve(message);
            } else {
                reject(message);
            }
        });
    }

    /**
     * Returns promise providing JSON of the message.
     * @param message
     * @returns {Promise}
     */
    convertToJson(message) {
        return new Promise((resolve, reject) => {
            try {
                if (message.utf8Data) {
                    resolve(JSON.parse(message.utf8Data));
                } else {
                    reject({message: 'Payload must contain data'});
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Returns true only if the json looks a message of arrays of type values (duck check).
     * @param json
     * @returns {boolean}
     */
    isMessageOfTypeValues(json) {
        let result = false;
        if (json.message == 'values' && Array.isArray(json.values)) {
            var values = json.values;
            if (values.length === 0) {
                result = true;
            } else if (typeof values[0].type !== 'undefined' && typeof values[0].devices !== 'undefined' && typeof values[0].values !== 'undefined') {
                result = true;
            }
        }
        return result;
    }

    /**
     * Returns true only if the json looks like a message of type values (duck check).
     * @param json
     * @returns {boolean}
     */
    isMessageOfTypeUpdate(json) {
        return (json.origin === 'update' && typeof json.type !== 'undefined' && typeof json.devices !== 'undefined' && typeof json.values !== 'undefined');
    }

    /**
     * Returns true only if the json looks like a message of type config (duck check).
     * @param json
     * @returns {boolean}
     */
    isMessageOfTypeConfig(json) {
        return (typeof json.devices !== 'undefined' && typeof json.settings !== 'undefined');
    }
}

module.exports = new Utils();