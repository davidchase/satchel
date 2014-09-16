Satchel
=======

A client database that uses IndexedDB, or localStorage depending on browser support.

No usage of WebSql nor plans for it.

!['satchel'](/image/satchel.png)

> Indiana Jones wears one

What is it?
-----------

This is a wrapper over localStorage and IndexedDB to create a somewhat 
seemless usage.

It uses promises instead of callbacks so there's a polyfill for those browsers

that don't currently support native promises.

If you want a more full fledged wrapper you can go to [localForage](https://github.com/mozilla/localForage).

Which this is partially based off of...

That is if you like requirejs and AMD, etc plus support for WebSQL :/


Under the hood
--------------

It uses [commonjs](http://wiki.commonjs.org/wiki/Modules/1.1.1) pattern for modules and [browserify](http://browserify.org/) to package them for the browser.

And a small promise poyfill.

Other than its all vanilla js