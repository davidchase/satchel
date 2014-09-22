Satchel
=======

A client database that uses IndexedDB, or localStorage depending on browser support.

No usage of WebSql nor plans for it.

!['satchel'](/image/satchel.png)

> Indiana Jones wears one

What is it?
-----------

This is a wrapper over localStorage and IndexedDB to create a seemless usage

with promises, for those browsers that do not support promises with provide

a polyfill thanks to [polyfill sevice](http://polyfill.webservices.ft.com/v1/)
by the guys over at the [Financial Times](https://github.com/Financial-Times)


Under the hood
--------------

It uses [commonjs](http://wiki.commonjs.org/wiki/Modules/1.1.1) pattern for modules and [browserify](http://browserify.org/) to package them for the browser.

And a small promise poyfill hosted via cdn.

Other than its all vanilla js

License
-------
MIT