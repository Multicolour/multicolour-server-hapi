"use strict"

process.env.NODE_ENV = "development"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("multicolour")

// Get the server plugin.
const Multicolour_Hapi_Server = require("../index")

// Where we keep the test content.
const test_content_path = "./tests/test_content"

// Create a fake plugin for the server.
class Test_Plugin extends Map {
  constructor() { super() }
  register(multicolour_server) {
    // Register a fake auth plugin on Hapi.
    const server = multicolour_server.request("raw")
    server.auth.scheme("basic", () => ({ authenticate: () => {} }))
    server.auth.strategy("basic", "basic", { host: multicolour_server.request("host") })
    server.auth.default("basic")
    multicolour_server.reply("auth_config", "basic")
  }
  handlers() {
    return new Map([
      ["create", () => this],
      ["destroy", () => this]
    ])
  }
}

// Create a multicolour instance.
const multicolour = Multicolour
  .new_from_config_file_path(`${test_content_path}/config.js`)
  .scan()

multicolour._enable_user_model()

// Start the database.
multicolour.get("database").start()
  .then(() => {

    tape("Multicolour_Server_Hapi.", test => {
      test.plan(6)

      // Register the plugin.
      test.doesNotThrow(() => multicolour.use(Multicolour_Hapi_Server), "Multicolour Hapi Server is registered as a plugin without error.")

      const server = multicolour.get("server")
      const headers = server.request("header_validator")

      // Generate routes so we have something to test against.
      server.generate_routes()

      test.doesNotThrow(() => server.use(Test_Plugin), "Can register plugins without error")
      test.doesNotThrow(() => server.start(server.stop.bind(server, () => {})), "Server starts and stops without error.")

      test.doesNotThrow(() => headers.set("test", 123), "Can set a test header")
      test.equal(headers.get("test"), 123, "Getting test header value")
      test.ok(headers.delete("test"), "Can remove test header")

      server.stop()
    })
  })
