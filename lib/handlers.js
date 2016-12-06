"use strict"

/**
 * Get the decorator assigned to an Accept header
 * value, if no negotiation available default
 * application/json is returned from the interface.
 * @param  {Object} reply_interface to return decorator on.
 * @param  {String} accept_value to try and get a decorator for.
 * @return {Function} decorator on the reply interface.
 */
function get_decorator_for_apply_value(reply_interface, accept_value) {
  // Normalise the passed value.
  const accept = accept_value ? accept_value.toString().toLowerCase() : "application/json"

  // Return the function.
  return reply_interface.hasOwnProperty(accept) ?
    reply_interface[accept].bind(reply_interface) :
    reply_interface["application/json"].bind(reply_interface)
}

/**
 * Check for errors or reply with the data and code.
 * @param  {Error|null} err that may or may not have happened.
 * @param  {Object|Array} models to reply with.
 * @param  {Waterline.Collection} collection these models come from.
 * @param  {Number} code to respond with.
 * @param  {Hapi.Response} reply interface.
 * @return {Hapi.Response} The reply interface.
 */
function check_errors_then_reply(err, decorator, models, collection, code, reply) {
  if (err) {
    // Check if it"s a Waterline error.
    if (err.code === "E_VALIDATION" || err.code === "E_UNKNOWN") {
      err.is_error = true
    }

    return get_decorator_for_apply_value(reply, decorator)(err, collection)
  }
  else {
    return get_decorator_for_apply_value(reply, decorator)(models, collection).code(code)
  }
}

class Route_Templates {
  register(server) {
    const multicolour = server.request("host")

    this.handlers = multicolour.get("handlers")

    server.reply("handlers", this)
  }

  /**
   * Posted data implies asset creation, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  POST(model, request, reply) {
    return this.handlers.POST(model, request, (err, models, collection) =>
      check_errors_then_reply(err, request.headers.accept, models, collection, 202, reply))
  }

  /**
   * Get an asset, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  GET(model, request, reply) {
    // @TODO: Remove once
    // https://github.com/glennjones/hapi-swagger/issues/238
    // is fixed.
    if (request.params.id === "{id}") {
      delete request.params.id
    }

    return this.handlers.GET(model, request, (err, models, collection) =>
      check_errors_then_reply(err, request.headers.accept, models, collection, 200, reply))
  }

  /**
   * Patch data implies asset update, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  PATCH(model, request, reply) {
    return this.handlers.PATCH(model, request, (err, models, collection) =>
      check_errors_then_reply(err, request.headers.accept, models, collection, 202, reply))
  }

  /**
   * Put data implies asset replacement, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  PUT(model, request, reply) {
    return this.handlers.PUT(model, request, (err, models, collection) =>
      check_errors_then_reply(err, request.headers.accept, models, collection, 202, reply))
  }

  /**
   * Delete implies permanent asset destruction, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  DELETE(model, request, reply) {
    return this.handlers.DELETE(model, request, (err, models, collection) =>
      check_errors_then_reply(err, request.headers.accept, models, collection, 204, reply))
  }

  /**
   * Upload handler for creating media. This function is
   * called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  UPLOAD(model, request, reply) {
    return this.handlers.UPLOAD(model, request, (err, models, collection) =>
      check_errors_then_reply(err, request.headers.accept, models, collection, 202, reply))
  }
}

// Export the templates.
module.exports = Route_Templates
