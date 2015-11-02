"use strict"

// Get the boom library.
const Boom = require("boom")

// Host will be set elsewhere.
let host = null

class Multicolour_Route_Templates {

  static set_host(target_host) {
    host = target_host
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
  static error_reply(err, reply) {
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

    // Populate any joins that exist (attributes with the `model` property.)
    for (const attr_name in this._attributes) {
      this._attributes[attr_name].model && query.populate(attr_name)
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

  /**
   * Upload handler for creating media. This function is
   * called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static UPLOAD(request, reply) {
    // Find the media data.
    this.findOne({
      id: request.params.id.toString()
    }, (err, model) => {
      // Check for errors.
      if (err) {
        reply(Boom.wrap(err))
      }
      // Check we found models.
      else if (!model) {
        reply(Boom.notFound("Pending upload failed, could not find s3_key"))
      }
      // Upload the file.
      else {
        // Upload the file.
        host.request("storage")
          .upload(request.payload.file.path, {
            name: `${model.s3_key}${require("path").extname(request.payload.file.filename)}`
          })
          .on("error", err => reply(Boom.wrap(err)))
          .on("end", () => {
            // Update the model and reply with the updated model.
            this.update({ id: model.id }, { pending: false }, (err, model) => {
              if (err) {
                reply(Boom.wrap(err))
              }
              else {
                reply(model).code(202)
              }
            })
          })
      }
    })
  }
}

// Export the templates.
module.exports = Multicolour_Route_Templates
