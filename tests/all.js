"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("multicolour")

// Get the server plugin.
const Multicolour_Hapi_Server = require("../index")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

tape("Plugin compatibility.", test => {
  const multicolour = new Multicolour({
    content: test_content_path
  }).scan()

  test.doesNotThrow(() => multicolour.use(Multicolour_Hapi_Server(multicolour)), "Multicolour Hapi Server is configured as plugin correctly.")
  test.end()
})
