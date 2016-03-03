"use strict"

// Get the tools.
const waterline_joi = require("waterline-joi")
const Plugin = require("multicolour/lib/plugin")
const Joi = require("joi")

/**
 * Shallow clone the provided object.
 * @param  {Object} attributes to clone.
 * @return {Object} cloned object.
 */
function clone_attributes(attributes) {
  return JSON.parse(JSON.stringify(attributes))
}

/**
 * Check over the associations in the collection
 * and fix them for the payloads.
 * @param  {Object} attributes from a collection.
 * @param  {String} type, either "string" or "object"
 * @return {Object} Fixed object.
 */
function check_and_fix_associations(attributes, type) {
  // If it's a string, remove erroneous keys.
  if (type === "string") {
    delete attributes.id
    delete attributes.createdAt
    delete attributes.updatedAt
  }

  // Loop over the attributes to see if we have
  // any relationship type fields to add validation for.
  for (const attribute in attributes) {
    if (attributes[attribute].hasOwnProperty("model")) {
      attributes[attribute] = type
    }
    else if (attributes[attribute].hasOwnProperty("collection")) {
      attributes[attribute] = type === "object" ? "array" : type
    }
  }

  return attributes
}

class Multicolour_Default_Validation extends Plugin {

  /**
   * Get the read only schema for a collection.
   * @param  {Waterline.Collection} collection to get payload for.
   * @return {Joi.Schema} Schema for any requests.
   */
  get_response_schema(collection) {
    // Clone the attributes.
    const attributes = clone_attributes(collection._attributes)

    // Get the base payload.
    const payload = waterline_joi(check_and_fix_associations(attributes, "object"))

    // Generate a Joi schema from a fixed version of the attributes.
    return Joi.alternatives().try(
      Joi.array().items(payload),
      payload
    )
  }

  get_error_schema() {
    return Joi.array()
  }

  /**
   * Get the schema for write operations.
   * @param  {Waterline.Collection} collection to get payload for.
   * @return {Joi.Schema} Schema for any requests.
   */
  get_payload_schema(collection) {
    // Get our tools.
    const extend = require("util")._extend
    const attributes = clone_attributes(collection._attributes)

    // Extend our attributes over some Waterline defaults.
    extend({
      id: collection._attributes.id,
      createdAt: collection._attributes.createdAt,
      updatedAt: collection._attributes.updatedAt
    }, attributes)

    // Return the schema.
    return waterline_joi(check_and_fix_associations(attributes, "string"))
  }

  /**
   * Register with the server properties required by this plugin.
   * @param  {Multicolour_Server_Hapi} server to register to.
   * @return {void}
   */
  register(server) {
    // Add this validator to the list.
    server.get("validators").push(this)

    server
      .reply("response_schema", this.get_response_schema.bind(this))
      .reply("payload_schema", this.get_payload_schema.bind(this))
  }
}

// Export the plugin.
module.exports = Multicolour_Default_Validation
