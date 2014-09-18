(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Promise = Promise || require('es6-promise').Promise;
var prime;
var PrimaryStorage = function(options) {

    this.db = {};
    this.dbInfo = {};
    this.openDB({
        name: options && options.name || 'clientDB',
        version: options && options.version || 1,
        storeName: options && options.storeName || 'testData'
    });
};
var PrimaryStorageProto = PrimaryStorage.prototype;

PrimaryStorageProto.openDB = function(options) {
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

PrimaryStorageProto.getItem = function(key) {
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

PrimaryStorageProto.setItem = function(key, value) {
    return new Promise(function(resolve, reject) {
        var store = this.db
            .transaction(this.dbInfo.storeName, 'readwrite')
            .objectStore(this.dbInfo.storeName);
        var request;

        if (value === undefined) {
            return reject('Value must be not be undefined or left off');
        }

        request = store.put(value, key);
        request.onsuccess = function() {
            resolve(value);
        };
        request.onerror = function() {
            reject(request.error);
        };
    }.bind(this));
};

PrimaryStorageProto.removeItem = function(key) {
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

PrimaryStorageProto.key = function(idx) {
    return new Promise(function(resolve, reject) {
        var store = this.db
            .transaction(this.dbInfo.storeName, 'readonly')
            .objectStore(this.dbInfo.storeName);
        var advancing = false;
        var request = store.openCursor();
        if (idx === undefined) {
            return reject('Index must be present and a number');
        }
        request.onsuccess = function(event) {
            var cursor = event.target.result;
            if (idx === 0) {
                return resolve(cursor.key);
            }

            if (!advancing) {
                advancing = true;
                cursor.advance(idx);
            } else {
                resolve(cursor.key);
            }

        };

        request.onerror = function() {
            reject(request.error);
        };
    }.bind(this));
};


PrimaryStorageProto.keys = function() {
    return new Promise(function(resolve, reject) {
        var store = this.db
            .transaction(this.dbInfo.storeName, 'readonly')
            .objectStore(this.dbInfo.storeName);
        var request = store.openCursor();
        var arr = [];

        request.onsuccess = function(event) {
            var cursor = event.target.result;
            if (!cursor) {
                resolve(arr);
                return;
            }
            arr.push(cursor.key);
            cursor.continue();
        };

        request.onerror = function() {
            reject(request.error);
        };
    }.bind(this));
};

PrimaryStorageProto.clear = function() {
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

PrimaryStorageProto.length = function() {
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

PrimaryStorageProto.deleteDB = function() {
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
prime = new PrimaryStorage();
module.exports = prime;
},{"es6-promise":5}],2:[function(require,module,exports){
'use strict';

// Fall back for browsers
// which dont support indexedDB yet :(

var Promise = Promise || require('es6-promise').Promise;
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
},{"es6-promise":5}],3:[function(require,module,exports){
'use strict';


// Declare internals
var internals = {};
var satchel = {};

internals.drivers = {
    primary: require('./drivers/indexeddb'),
    secondary: require('./drivers/localstorage')
};

internals.checkPrimarySupport = function() {
    var primarySupported = 'indexedDB' in window &&
        indexedDB.open('_satchel', 1).onupgradeneeded === null;

    if (primarySupported) {
        satchel = internals.drivers.primary;
        return satchel;
    }
    satchel = internals.drivers.secondary;
    return satchel;
};

internals.checkPrimarySupport();

// export that goodness !
module.exports = satchel;
},{"./drivers/indexeddb":1,"./drivers/localstorage":2}],4:[function(require,module,exports){
'use strict';
var satchel = require('./index');

window.satchel = satchel;
},{"./index":3}],5:[function(require,module,exports){
"use strict";
var Promise = require("./promise/promise").Promise;
var polyfill = require("./promise/polyfill").polyfill;
exports.Promise = Promise;
exports.polyfill = polyfill;
},{"./promise/polyfill":9,"./promise/promise":10}],6:[function(require,module,exports){
"use strict";
/* global toString */

var isArray = require("./utils").isArray;
var isFunction = require("./utils").isFunction;

/**
  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The return promise
  is fulfilled with an array that gives all the values in the order they were
  passed in the `promises` array argument.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @for RSVP
  @param {Array} promises
  @param {String} label
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
*/
function all(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && isFunction(promise.then)) {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}

exports.all = all;
},{"./utils":14}],7:[function(require,module,exports){
(function (process,global){
"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

// node
function useNextTick() {
  return function() {
    process.nextTick(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

function useSetTimeout() {
  return function() {
    local.setTimeout(flush, 1);
  };
}

var queue = [];
function flush() {
  for (var i = 0; i < queue.length; i++) {
    var tuple = queue[i];
    var callback = tuple[0], arg = tuple[1];
    callback(arg);
  }
  queue = [];
}

var scheduleFlush;

// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else {
  scheduleFlush = useSetTimeout();
}

function asap(callback, arg) {
  var length = queue.push([callback, arg]);
  if (length === 1) {
    // If length is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    scheduleFlush();
  }
}

exports.asap = asap;
}).call(this,require("UPikzY"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"UPikzY":15}],8:[function(require,module,exports){
"use strict";
var config = {
  instrument: false
};

function configure(name, value) {
  if (arguments.length === 2) {
    config[name] = value;
  } else {
    return config[name];
  }
}

exports.config = config;
exports.configure = configure;
},{}],9:[function(require,module,exports){
(function (global){
"use strict";
/*global self*/
var RSVPPromise = require("./promise").Promise;
var isFunction = require("./utils").isFunction;

function polyfill() {
  var local;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof window !== 'undefined' && window.document) {
    local = window;
  } else {
    local = self;
  }

  var es6PromiseSupport = 
    "Promise" in local &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    "resolve" in local.Promise &&
    "reject" in local.Promise &&
    "all" in local.Promise &&
    "race" in local.Promise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function() {
      var resolve;
      new local.Promise(function(r) { resolve = r; });
      return isFunction(resolve);
    }());

  if (!es6PromiseSupport) {
    local.Promise = RSVPPromise;
  }
}

exports.polyfill = polyfill;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./promise":10,"./utils":14}],10:[function(require,module,exports){
"use strict";
var config = require("./config").config;
var configure = require("./config").configure;
var objectOrFunction = require("./utils").objectOrFunction;
var isFunction = require("./utils").isFunction;
var now = require("./utils").now;
var all = require("./all").all;
var race = require("./race").race;
var staticResolve = require("./resolve").resolve;
var staticReject = require("./reject").reject;
var asap = require("./asap").asap;

var counter = 0;

config.async = asap; // default async is asap;

function Promise(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  if (!(this instanceof Promise)) {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this._subscribers = [];

  invokeResolver(resolver, this);
}

function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    resolve(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;
}

function publish(promise, settled) {
  var child, callback, subscribers = promise._subscribers, detail = promise._detail;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    invokeCallback(settled, child, callback, detail);
  }

  promise._subscribers = null;
}

Promise.prototype = {
  constructor: Promise,

  _state: undefined,
  _detail: undefined,
  _subscribers: undefined,

  then: function(onFulfillment, onRejection) {
    var promise = this;

    var thenPromise = new this.constructor(function() {});

    if (this._state) {
      var callbacks = arguments;
      config.async(function invokePromiseCallback() {
        invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
      });
    } else {
      subscribe(this, thenPromise, onFulfillment, onRejection);
    }

    return thenPromise;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = all;
Promise.race = race;
Promise.resolve = staticResolve;
Promise.reject = staticReject;

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    if (resolved) { return true; }
    reject(promise, error);
    return true;
  }

  return false;
}

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = value;

  config.async(publishFulfillment, promise);
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = reason;

  config.async(publishRejection, promise);
}

function publishFulfillment(promise) {
  publish(promise, promise._state = FULFILLED);
}

function publishRejection(promise) {
  publish(promise, promise._state = REJECTED);
}

exports.Promise = Promise;
},{"./all":6,"./asap":7,"./config":8,"./race":11,"./reject":12,"./resolve":13,"./utils":14}],11:[function(require,module,exports){
"use strict";
/* global toString */
var isArray = require("./utils").isArray;

/**
  `RSVP.race` allows you to watch a series of promises and act as soon as the
  first promise given to the `promises` argument fulfills or rejects.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.race` is deterministic in that only the state of the first completed
  promise matters. For example, even if other promises given to the `promises`
  array argument are resolved, but the first completed promise has become
  rejected before the other promises became fulfilled, the returned promise
  will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // Code here never runs because there are rejected promises!
  }, function(reason){
    // reason.message === "promise2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  @method race
  @for RSVP
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise that becomes fulfilled with the value the first
  completed promises is resolved with if the first completed promise was
  fulfilled, or rejected with the reason that the first completed promise
  was rejected with.
*/
function race(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to race.');
  }
  return new Promise(function(resolve, reject) {
    var results = [], promise;

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  });
}

exports.race = race;
},{"./utils":14}],12:[function(require,module,exports){
"use strict";
/**
  `RSVP.reject` returns a promise that will become rejected with the passed
  `reason`. `RSVP.reject` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become rejected with the given
  `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Promise = this;

  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

exports.reject = reject;
},{}],13:[function(require,module,exports){
"use strict";
function resolve(value) {
  /*jshint validthis:true */
  if (value && typeof value === 'object' && value.constructor === this) {
    return value;
  }

  var Promise = this;

  return new Promise(function(resolve) {
    resolve(value);
  });
}

exports.resolve = resolve;
},{}],14:[function(require,module,exports){
"use strict";
function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x) {
  return typeof x === "function";
}

function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };


exports.objectOrFunction = objectOrFunction;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.now = now;
},{}],15:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[4])