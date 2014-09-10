/* global indexedDB */
'use strict';
// Require what we need
var Promise = require('es6-promise');
var indexeddb = require('./drivers/indexeddb');
var localstorage = require('./drivers/localstorage');

// Declare internals
var internals = {};

internals.driverType = {
    INDEXEDDB: 'asyncStorage',
    LOCALSTORAGE: 'localStorageWrapper'
};

internals.storageCheck = function() {
    var clientDB = 'clientDB';
    // unfortunately the try and catch
    // is needed due to browsers throwing
    // errors such a firefox...
    try {
        localStorage.setItem(clientDB, clientDB);
        localStorage.removeItem(clientDB);
        return true;
    } catch (e) {
        return false;
    }
};

internals.driverSupport = function() {
    var result = {};
    result[internals.driverType.INDEXEDDB] =
        indexedDB && indexedDB.open('_current', 1).onupgradeneeded === null;
    result[internals.driverType.LOCALSTORAGE] = internals.storageCheck();

    return result;
};



var BrowserDB = function() {
    this.config = {
        description: '',
        name: 'browserDB',
        size: 4980736,
        storeName: 'keyvaluepairs',
        version: 1.0
    };
    this.driverSet = null;
    this.ready = false;
};

var BrowserDBProto = BrowserDB.prototype;

BrowserDBProto.config = function(options) {
    var self = this;
    var types = {
        'object': function() {
            if (self.ready) {
                throw new Error("Can't call config after browserDB has been used.");
            }
            for (var item in options) {
                if (options.hasOwnProperty(item)) {
                    self.config[item] = options[item];
                }
            }

            return true;
        },
        'string': function() {
            return self.config[options];
        },
        'default': function() {
            return self.config;
        }
    };
    return (types[typeof options] || types['default']).call(null);
};

BrowserDBProto.driver = function() {
    return this.driver || null;
};

BrowserDBProto.ready = function() {};
BrowserDBProto.setDriver = function() {};
BrowserDBProto.supports = function(driverName) {
    return !!internals.driverSupport[driverName];
};

// export that goodness !
module.exports = BrowserDB;