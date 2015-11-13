"use strict"

class Multicolour_Server_Hapi_Headers {
  // Just call the super() method so we have scope.
  constructor() {
    this._headers = {}
  }

  set(name, value) {
    this._headers[escape(name)] = value
    return this
  }

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
