"use strict"

const Endpoint = require("multicolour/endpoint")

module.exports = new Endpoint({
  name: {
    required: true,
    type: "string"
  }
})
  .add_create_route()
  .add_read_route()
  .add_update_route()
  .add_delete_route()
  .add_update_or_create_route()
