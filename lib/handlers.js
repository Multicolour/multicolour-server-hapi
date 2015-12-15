"use strict"

// Get some tools.
const handlers = require("multicolour/lib/handlers")

// Host will be set elsewhere.
let host = null

/**
 * Check for errors or reply with the data and code.
 * @param  {Error|null} err that may or may not have happened.
 * @param  {Object|Array} models to reply with.
 * @param  {Waterline.Collection} collection these models come from.
 * @param  {Number} code to respond with.
 * @param  {Hapi.Response} reply interface.
 * @return {Hapi.Response} The reply interface.
 */
const check_errors_then_reply = (err, models, collection, code, reply) =>
  err ?
    Route_Templates.error_reply(err, reply, collection).code(code || 500) :
    reply[host.request("decorator")](models, collection).code(code || 200)

class Route_Templates {
  /**
   * Set the multicolour instance for binding.
   * @param {multicolour} target_host for binding.
   * @return {multicolour} host for binding.
   */
  static set_host(target_host) {
    host = target_host
    handlers.set_host(target_host)
    return host
  }

  /**
   * Errors come in a couple of different formats,
   * this function normalises the error to be
   * replied with via Boom.
   * @param  {Error} err to reply with.
   * @param  {Hapi.Reply} reply object to use.
   * @return {Hapi.Reply} Object for chaining methods.
   */
  static error_reply(err, reply, collection) {
    // Check if it"s a Waterline error.
    if (err.code === "E_VALIDATION" || err.code === "E_UNKNOWN") {
      err.is_error = true
    }
    
    return reply[host.request("decorator")](err, collection)
  }

  /**
   * Posted data implies asset creation, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static POST(request, reply) {
    handlers.POST.call(this, request, (err, models, collection) =>
      check_errors_then_reply(err, models, collection, 202, reply))
  }

  /**
   * Get an asset, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static GET(request, reply) {
    handlers.GET.call(this, request, (err, models, collection) =>
      check_errors_then_reply(err, models, collection, 200, reply))
  }

  /**
   * Patch data implies asset update, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static PATCH(request, reply) {
    handlers.PATCH.call(this, request, (err, models, collection) =>
      check_errors_then_reply(err, models, collection, 202, reply))
  }

  /**
   * Put data implies asset replacement, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static PUT(request, reply) {
    handlers.PUT.call(this, request, (err, models, collection) =>
      check_errors_then_reply(err, models, collection, 202, reply))
  }

  /**
   * Delete implies permanent asset destruction, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static DELETE(request, reply) {
    handlers.DELETE.call(this, request, (err, models, collection) =>
      check_errors_then_reply(err, models, collection, 202, reply))
  }

  /**
   * Upload handler for creating media. This function is
   * called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static UPLOAD(request, reply) {
    handlers.UPLOAD.call(this, request, (err, models, collection) =>
      check_errors_then_reply(err, models, collection, 202, reply))
  }
}

// Export the templates.
module.exports = Route_Templates
