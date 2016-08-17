"use strict"

const debug = require("debug")

class Sockets {
  constructor() {
    this.debug = debug("multicolour:server:websockets")

    this.debug("Websockets pre-register.")
  }

  register(server) {
    // Set the sockets adapter on the server.
    server.set("sockets", this)

    // Register the nes plugin.
    server.request("raw").register(require("nes"), err => {
      if (err) throw err
    })
  }
}

module.exports = Sockets
