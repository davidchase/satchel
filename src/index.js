/* global indexedDB */
'use strict';
// Require what we need
var Promise = Promise || require('es6-promise');
var indexeddb = require('./drivers/indexeddb');
var localstorage = require('./drivers/localstorage');
// might not need it since its no longer
// being developed and 5MB of localstorage is good
var websql = require('./drivers/websql');

// Declare internals
var internals = {};

internals.driverType = {
    INDEXEDDB: 'asyncStorage',
    LOCALSTORAGE: 'localStorageWrapper',
    WEBSQL: 'webSQLStorage'
};

internals.driverSupport = function() {
    var result = {};
    result[internals.driverType.WEBSQL] = !!openDatabase;
    result[internals.driverType.INDEXEDDB] =
        indexedDB && indexedDB.open('_current', 1).onupgradeneeded === null;
    result[internals.driverType.LOCALSTORAGE] = !!localStorage;

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
        'undefined': function() {
            return self.config;
        }
    };
    if (types[typeof options] === 'function') {
        types[typeof options].call(null);
    }
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