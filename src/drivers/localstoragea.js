'use strict';

// Fall back for browsers
// which dont support indexedDB yet :(

var Promise = Promise || require('es-promise');
var StorageWars = function() {
    // Check for localStorage
    var storage = 'storageWar';
    try {
        localStorage.setItem(storage, storage);
        localStorage.removeItem(storage);
    } catch (e) {
        return;
    }
};
var StorageWarsProto = StorageWars.prototype;
StorageWarsProto.setItem = function(key, value) {
    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }
    return new Promise(function(resolve, reject) {
        if (value === undefined || value === null) {
            return reject('Value must be a valid object or string');
        }
        localStorage.setItem(key, value);
        resolve(value);
    });
};
StorageWarsProto.getItem = function(key) {
    return new Promise(function(resolve, reject) {
        var value = localStorage.getItem(key);
        if (value === null) {
            return reject('Key is invalid or doesn\'t exist');
        }
        resolve(JSON.parse(value));
    });
};
StorageWarsProto.length = function() {
    return new Promise(function(resolve) {
        var count = localStorage.length;
        resolve(count);
    });
};
StorageWarsProto.clear = function() {
    return new Promise(function(resolve) {
        localStorage.clear();
        resolve('Local storage cleared');
    });
};
StorageWarsProto.key = function(idx) {
    var key = 0;
    return new Promise(function(resolve, reject) {
        if (idx === undefined || typeof idx !== 'number') {
            return reject('Index must be a number and present');
        }
        key = localStorage.key(idx);
        resolve(key);
    });
};

module.exports = StorageWars;