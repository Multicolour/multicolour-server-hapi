"use strict"

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
  register() { return this }
  handlers() {
    return new Map([
      ["create", () => this],
      ["destroy", () => this]
    ])
  }
}

// Create a multicolour instance.
const multicolour = Multicolour.new_from_config_file_path(`${test_content_path}/config.js`).scan()

tape("Plugin compatibility.", test => {
  test.doesNotThrow(() => multicolour.use(Multicolour_Hapi_Server), "Multicolour Hapi Server is registered as a plugin without error.")
  test.end()
})

tape("Plugin predictability/coverage.", test => {
  // Use the server.
  multicolour.use(Multicolour_Hapi_Server)

  // Test for items we expect to exist/function once register.
  test.doesNotThrow(() => multicolour.get("server").generate_routes(), "Does not throw when generating routes.")
  test.ok(multicolour.get("server"), "Multicolour Hapi Server is configured as plugin correctly and can `get`.")
  test.ok(multicolour.get("server").request("raw"), "Can get raw server from plugin")
  test.doesNotThrow(() => multicolour.get("server").use(Test_Plugin), "Can register plugins without error")

  test.end()
})

tape("Default decorator is functional.", test => {
  multicolour.get("database").start(() => {
    multicolour.get("server").request("raw").inject("/csrf", response => {
      test.equal(response.statusCode, 200, "Response code should be 200")
      // console.log(multicolour.get("server").request("raw").table()[0].table[0]);
      // test.equal(joi.validate(JSON.parse(response.payload), reply_payloads[test_name]).error, null, "Payload validation should have no errors.")
      test.end()
    })
  })
})

tape("Starts and stops without error", test => {
  // This is just for coverage.
  test.doesNotThrow(() => multicolour.start(multicolour.stop.bind(multicolour)), "Starts and stops without error.")
  // test.doesNotThrow(() => multicolour.start(() => multicolour.stop(() => {})), "Starts and stops without error with stop callback.")
})
