"use strict"

class Multicolour_Route_Templates {
  static errorReply(err, reply) {
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
    return reply({
      code: code,
      error: err.message ? err.message.toString() : err
    }).takeover().code(code)
  }

  static POST(request, reply) {
    this.create(request.payload, (err, model) => {
      if (err) {
        Multicolour_Route_Templates.errorReply(err, reply)
      }
      else {
        reply(model).code(201)
      }
    })
  }

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
        Multicolour_Route_Templates.errorReply(err, reply)
      }
      else {
        reply(models).code(200)
      }
    })
  }

  static PUT(request, reply) {
    this.update(request.params.id, request.payload, (err, model) => {
      if (err) {
        Multicolour_Route_Templates.errorReply(err, reply)
      }
      else {
        reply(model).code(202)
      }
    })
  }

  static DELETE(request, reply) {
    this.destroy(request.params.id, (err, model) => {
      if (err) {
        Multicolour_Route_Templates.errorReply(err, reply)
      }
      else {
        reply(model).code(202)
      }
    })
  }
}

module.exports = Multicolour_Route_Templates
