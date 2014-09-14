'use strict';
var Promise = Promise || require('es-promise');
var PrimaryStorage = function(options) {
    // Exits if no indexedDB
    // may need to return false for checks
    if (!indexedDB) {
        return;
    }

    this.db = {};
    this.dbInfo = {};
    this.openDB({
        name: options && options.name || 'clientDB',
        version: options && options.version || 1,
        storeName: options && options.storeName || 'testData'
    });
};
var PrimaryProto = PrimaryStorage.prototype;

PrimaryProto.openDB = function(options) {
    var _this = this;
    var option;
    if (options && typeof options === 'object') {
        for (option in options) {
            if (options.hasOwnProperty(option)) {
                this.dbInfo[option] = options[option];
            }
        }
    }

    return new Promise(function(resolve, reject) {
        var request = indexedDB.open(_this.dbInfo.name, _this.dbInfo.version);

        request.onerror = function(event) {
            reject(event.target.errorCode);
        };

        request.onupgradeneeded = function(event) {
            event.currentTarget.result.createObjectStore(_this.dbInfo.storeName);
        };

        request.onsuccess = function() {
            // Better for gc (garbage collection)
            // see here for details: http://goo.gl/9jIlNV
            _this.db = this.result;
            resolve();
        };

    });
};

PrimaryProto.getItem = function(key) {
    return new Promise(function(resolve, reject) {
        var store = this.db
            .transaction(this.dbInfo.storeName, 'readonly')
            .objectStore(this.dbInfo.storeName);
        var request = store.get(key);

        request.onsuccess = function(event) {
            var value = event.target.result;
            if (value === undefined) {
                value = null;
            }
            resolve(value);
        };

        request.onerror = function() {
            reject(request.error);
        };
    }.bind(this));
};

PrimaryProto.setItem = function(key, value) {
    return new Promise(function(resolve, reject) {
        var store = this.db
            .transaction(this.dbInfo.storeName, 'readwrite')
            .objectStore(this.dbInfo.storeName);
        var request;

        // The reason we don't _save_ null is because IE 10 does
        // not support saving the `null` type in IndexedDB. How
        // ironic, given the bug below!
        // See: https://github.com/mozilla/localForage/issues/161
        if (value === null) {
            value = undefined;
        }

        request = store.put(value, key);
        request.onsuccess = function() {
            // Cast to undefined so the value passed to
            // callback/promise is the same as what one would get out
            // of `getItem()` later. This leads to some weirdness
            // (setItem('foo', undefined) will return `null`), but
            // it's not my fault localStorage is our baseline and that
            // it's weird.
            if (value === undefined) {
                value = null;
            }

            resolve(value);
        };
        request.onerror = function() {
            reject(request.error);
        };
    }.bind(this));
};

PrimaryProto.removeItem = function(key) {
    return new Promise(function(resolve, reject) {
        var store = this.db
            .transaction(this.dbInfo.storeName, 'readwrite')
            .objectStore(this.dbInfo.storeName);

        var request = store['delete'](key);
        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function() {
            reject(request.error);
        };

        // The request will be aborted if we've exceeded our storage
        // space. In this case, we will reject with a specific
        // "QuotaExceededError".
        request.onabort = function(event) {
            var error = event.target.error;
            if (error === 'QuotaExceededError') {
                reject(error);
            }
        };
    }.bind(this));
};

PrimaryProto.clear = function() {
    return new Promise(function(resolve, reject) {
        var store = this.db
            .transaction(this.dbInfo.storeName, 'readwrite')
            .objectStore(this.dbInfo.storeName);
        var request = store.clear();

        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function() {
            reject(request.error);
        };
    }.bind(this));
};

PrimaryProto.length = function() {
    return new Promise(function(resolve, reject) {
        var store = this.db
            .transaction(this.dbInfo.storeName, 'readonly')
            .objectStore(this.dbInfo.storeName);
        var request = store.count();

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    }.bind(this));
};

PrimaryProto.deleteDB = function() {
    return new Promise(function(resolve, reject) {
        var request;
        this.db.close();
        request = indexedDB.deleteDatabase(this.dbInfo.name);
        request.onsuccess = function() {
            resolve("Deleted database successfully");
        };

        request.onerror = function() {
            reject("Couldn't delete database");
        };

        request.onblocked = function() {
            reject("Couldn't delete database due to the operation being blocked");
        };
    }.bind(this));
};

module.exports = PrimaryStorage;