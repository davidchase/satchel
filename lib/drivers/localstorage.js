'use strict';

// Fall back for browsers
// which dont support indexedDB yet :(

var Promise = Promise || require('es-promise');
var internals = {};
var FallbackStorage = function() {};
var FallbackStorageProto = FallbackStorage.prototype;
FallbackStorageProto.setItem = function(key, value) {
    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }
    return new Promise(function(resolve, reject) {
        if (value === undefined) {
            return reject('Value must be a valid object, number or string');
        }
        localStorage.setItem(key, value);
        resolve(value);
    });
};
FallbackStorageProto.getItem = function(key) {
    return new Promise(function(resolve, reject) {
        var value = localStorage.getItem(key);
        if (value === null) {
            return reject('Key is invalid or doesn\'t exist');
        }
        resolve(JSON.parse(value));
    });
};
FallbackStorageProto.removeItem = function(key) {
    return new Promise(function(resolve, reject) {
        if (key === undefined) {
            return reject('Please specify a key to remove');
        }
        localStorage.removeItem(key);
        resolve('Key was successfully removed');
    });
};
FallbackStorageProto.length = function() {
    return new Promise(function(resolve) {
        var count = localStorage.length;
        resolve(count);
    });
};
FallbackStorageProto.clear = function() {
    return new Promise(function(resolve) {
        localStorage.clear();
        resolve('Local storage cleared');
    });
};
FallbackStorageProto.key = function(idx) {
    var key = 0;
    return new Promise(function(resolve, reject) {
        if (idx === undefined || typeof idx !== 'number') {
            return reject('Index must be a number and present');
        }
        key = localStorage.key(idx);
        resolve(key);
    });
};
FallbackStorageProto.keys = function() {
    var i = 0;
    var len = localStorage.length;
    var arr = [];
    return new Promise(function(resolve) {
        for (i; i < len; i++) {
            arr.push(localStorage.key(i));
        }
        resolve(arr);
    });
};

internals.checkStorage = function() {
    // Check for localStorage
    var storage = 'storageWar';
    try {
        localStorage.setItem(storage, storage);
        localStorage.removeItem(storage);
        return Object.create(FallbackStorage.prototype);
    } catch (e) {
        return false;
    }
};

module.exports = internals.checkStorage;