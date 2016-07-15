"use strict"

// Get some tools.
const Joi = require("joi")

class Multicolour_Server_Hapi_Headers {
  // Set up a target object to set headers to.
  constructor() {
    this._headers = {
      accept: Joi.string()
        .valid("application/json")
        .default("application/json")
        .required()
    }
  }

  /**
   * Set and overwrite any header by the escaped
   * `name` to/with any string value.
   * @param {String} name of the header to set.
   * @param {String} value to set this header to.
   */
  set(name, value) {
    this._headers[escape(name)] = value
    return this
  }

  /**
   * Get the value of a header. If no name is
   * provided, all headers are returned.
   * @param  {String} name of the header to get [optional]
   * @return {String|Object} Either the value of `name` header or all headers.
   */
  get(name) {
    if (name) {
      return this._headers[escape(name)]
    }
    else {
      const out = {}
      Object.keys(this._headers).forEach(header => out[unescape(header)] = this._headers[header])
      return out
    }
  }

  /**
   * Register this plugin with the server.
   * @param  {Multicolour_Server_Hapi} multicolour_server to register to.
   * @return {Multicolour_Server_Hapi} multicolour_server with registered plugin.
   */
  register(multicolour_server) {
    // Register this plugin.
    multicolour_server.reply("header_validator", this)

    // Exit.
    return multicolour_server
  }
}

// Export our tools.
module.exports = Multicolour_Server_Hapi_Headers
