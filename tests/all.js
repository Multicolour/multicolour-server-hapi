"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("multicolour")

// Get the server plugin.
const Multicolour_Hapi_Server = require("../index")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

class Test_Plugin extends Map {
  constructor() { super() }
  register() { return this }
  handlers() {
    return new Map([
      ["create", () => this],
      ["destroy", () => this]
    ])
  }
}

tape("Plugin compatibility.", test => {
  const multicolour = new Multicolour({
    content: test_content_path
  }).scan()

  test.doesNotThrow(() => multicolour.use(Multicolour_Hapi_Server), "Multicolour Hapi Server is configured as plugin correctly.")
  test.end()
})

tape("Plugin predictability/coverage.", test => {
  // Configure the service.
  const multicolour = new Multicolour({
    content: test_content_path,
    auth: { providers: [] },
    db: { adapters: { development: {} }, connections: { development: { adapter: "development" } } }
  }).scan()

  // Use the server.
  multicolour.use(Multicolour_Hapi_Server)

  // Test for items we expect to exist/function once register.
  test.ok(multicolour.get("server"), "Multicolour Hapi Server is configured as plugin correctly and can `get`.")
  test.ok(multicolour.get("server").request("raw"), "Can get raw server from plugin")
  test.ok(multicolour.get("server").use(Test_Plugin), "Can get plugin host from plugin")

  // This is just for coverage.
  test.doesNotThrow(() => multicolour.start(multicolour.stop.bind(multicolour)), "Starts.")

  test.end()
})
