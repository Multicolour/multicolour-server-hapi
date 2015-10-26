"use strict"

class Multicolour_Route_Templates {
  /**
   * Errors come in a couple of different formats,
   * this function normalises the error to be
   * replied with via Boom.
   * @param  {Error} err to reply with.
   * @param  {Hapi.Reply} reply object to use.
   * @return {Hapi.Reply} Object for chaining methods.
   */
  static error_reply(err, reply) {
    // Get the boom library.
    const Boom = require("boom")

    // Default code is 500.
    let code = 500

    // Check if it"s a Waterline error.
    if (err.code === "E_VALIDATION") {
      code = 400
    }
    // Otherwise check if we passed in a code.
    else if (err.code) {
      code = err.code
    }

    // Do the actual reply.
    return reply(Boom.create(code, err.message ? err.message.toString() : err, err))
  }

  /**
   * Posted data implies asset creation, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static POST(request, reply) {
    this.create(request.payload, (err, model) => {
      if (err) {
        Multicolour_Route_Templates.error_reply(err, reply)
      }
      else {
        reply(model).code(201)
      }
    })
  }

  /**
   * Get an asset, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static GET(request, reply) {
    // Default is to list all entries.
    let query = this.find()

    // Unless we"re passed an id, then find that one.
    if (request.params.id) {
      query = this.find({ id: request.params.id })
    }

    // Execute the query.
    query.exec((err, models) => {
      if (err) {
        Multicolour_Route_Templates.error_reply(err, reply)
      }
      else {
        reply(models).code(200)
      }
    })
  }

  /**
   * Put data implies asset update, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static PUT(request, reply) {
    this.update(request.params.id, request.payload, (err, model) => {
      if (err) {
        Multicolour_Route_Templates.error_reply(err, reply)
      }
      else {
        reply(model).code(202)
      }
    })
  }

  /**
   * Delete implies permanent asset destruction, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static DELETE(request, reply) {
    this.destroy(request.params.id, (err, model) => {
      if (err) {
        Multicolour_Route_Templates.error_reply(err, reply)
      }
      else {
        reply(model).code(202)
      }
    })
  }
}

// Export the templates.
module.exports = Multicolour_Route_Templates
