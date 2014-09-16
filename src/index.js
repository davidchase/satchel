'use strict';

var satchel = {};
// Declare internals
var internals = {};

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


// export that goodness !
module.exports = satchel;