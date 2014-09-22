 'use strict';

 var satchel = {};
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
         return true;
     }
     satchel = internals.drivers.secondary;
     return false;
 };

 internals.checkPrimarySupport();


 // export that goodness !
 module.exports = satchel;
 // expose to window for non-cmjs support
 window.satchel = satchel;