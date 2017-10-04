# multicolour-server-hapi

[![Greenkeeper badge](https://badges.greenkeeper.io/Multicolour/multicolour-server-hapi.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/Multicolour/multicolour-server-hapi.svg)](https://travis-ci.org/Multicolour/multicolour-server-hapi)
[![Coverage Status](https://coveralls.io/repos/Multicolour/multicolour-server-hapi/badge.svg?branch=master&service=github)](https://coveralls.io/github/Multicolour/multicolour-server-hapi?branch=master)
[![Dependency Status](https://david-dm.org/Multicolour/multicolour-server-hapi.svg)](https://david-dm.org/Multicolour/multicolour-server-hapi)

[HapiJS][hapi] Server generator for [Multicolour][multicolour]. Comes with Hapi

* Swagger for automatic endpoint documentation
* Rate limiting
* Server side caching
* Payload validation and documentation
* Response validation and documentation
* CSRF token validation

#### Via `multicolour` CLI

`multicolour plugin-add server-hapi`

#### Via `npm` CLI

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

### API documentation

The swagger documentation is only available when the `NODE_ENV` environmental isn't equal to `production`. You can visit your API's documentation by visiting [`http://localhost:1811/docs`](http://localhost:1811/docs). If your custom routes aren't showing up on that page you need to add the `api` tag to it in it's config.

### Rate limiting

To add rate limiting simply update your services `config.js` settings to include `rate_limiting`. Example:

Before rate limiting will work you need to specify a server side caching mechanism first in your server configuration, for example to add an in-memory cache

```js
{
  api_server: {
    cache: require("catbox-memory")
  },
  settings: {
    rate_limiting: {
      // Rate limiter docs are here  
      // https://www.npmjs.com/package/hapi-rate-limit
    }
  },
  ...config
}
```

More documentation is available on the [Hapi website](https://hapijs.com/tutorials/caching#client)

### Validation

The plugin reads your blueprints and creates Joi payload validations and Joi response validations.

### CSRF

This plugin supports [CSRF tokens](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)_Prevention_Cheat_Sheet). You can get a token for your session by running a `GET` request on `/csrf`.

Your requests will *all* 403 without the `x-csrf-token` header set to the value returned by the `/csrf` endpoint.

Enable or disable CSRF by adding `my_service.reply("csrf_enabled", Boolean)` to your `app.js`.

### Plugins

This server has support for plugins, such as the [OAuth plugin][oauth plugin] via the `.use` interface i.e `my_server.use(require("multicolour-hapi-oauth"))`

#### HapiJS plugins/access.

Access to the raw HapiJS server is possible via `server.request("raw")` which will
return the instance of HapiJS behind the plugin.

[hapi]: https://hapijs.com
[multicolour]: https://github.com/Multicolour/multicolour
[oauth plugin]: https://github.com/Multicolour/multicolour-auth-oauth
[usedocs]: https://getmulticolour.com/docs/0.6.3/plugins/
