# multicolour-server-hapi

[![Build Status](https://travis-ci.org/newworldcode/multicolour-server-hapi.svg)](https://travis-ci.org/newworldcode/multicolour-server-hapi)
[![Coverage Status](https://coveralls.io/repos/newworldcode/multicolour-server-hapi/badge.svg?branch=master&service=github)](https://coveralls.io/github/newworldcode/multicolour-server-hapi?branch=master)
[![Dependency Status](https://david-dm.org/newworldcode/multicolour-server-hapi.svg)](https://david-dm.org/newworldcode/multicolour-server-hapi)

[HapiJS][hapi] Server generator for [Multicolour][multicolour]. Comes with Hapi
Swaggered for automatic endpoint documentation via swaggered-ui.

`npm i --save multicolour-server-hapi`

### Manual usage in a Multicolour app.

To use the plugin manually (as opposed to via the Multicolour CLI) use the [`.use(plugin)`][usedocs] function of multicolour.

```js
"use strict"

// Configure our service.
const my_service = require("multicolour")
  // Configure the service core and scan for content.
  .new_from_config_file_path("./config.js")
  .scan()

  // Register the server plugin.
  .use(require("multicolour-server-hapi"))

// Start the service.
my_service.start()
```

### Plugins

This server has support for plugins, such as the [OAuth plugin][oauth plugin] via
 the `.use` interface.

Currently, `multicolour-server-hapi` only supports the `AUTH_PLUGIN` type, to create
an auth plugin for `multicolour-server-hapi` you need to register your plugin via
the `.use(plugin)` function. I.E

```js

// Get the types that Multicolour understands.
const types = require("multicolour/lib/consts")

// This is the logic of our plugin.
class My_Auth_Plugin extends Map {
  // Required methods on ALL plugins.
  constructor() { super() }
  register() { return this }
  handlers() {
    return new Map([
      ["create", () => this],
      ["destroy", () => this]
    ])
  }
}

// This is the registration signature of the plugin.
module.exports = {
  type: types.AUTH_PLUGIN,
  plugin: My_Auth_Plugin
}
```

In the above class definition, we can see `My_Auth_Plugin` has some interesting things:  

3 methods, `constructor`, `register` and `handlers`.  
`extends Map`, `super()`.

The three methods are the signature of the plugin, this shouldn't be confused with the registration signature (the `module.exports = ...`). The server plugin should call these functions to register and handle behaviour when and where it is required.

The plugin `extends Map` as we need to store information on the class at runtime without
some other complicated interface wrapping the plugin. `super()` is required as per the ES6 specification.

Any plugins registered to this server won't receive the graceful shutdown message that the server does, this may change if it become and error but message propagation is a messy business.

#### HapiJS plugins/access.

Access to the raw HapiJS server is possible via `server.request("raw")` which will
return the instance of HapiJS behind the plugin.

[hapi]: hapijs.com
[multicolour]: https://github.com/newworldcode/multicolour
[oauth plugin]: https://github.com/newworldcode/multicolour-auth-oauth
[usedocs]: https://github.com/newworldcode/multicolour/wiki/Multicolour#use
