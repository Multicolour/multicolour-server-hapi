"use strict"

// Get the boom library.
const Boom = require("boom")

// Host will be set elsewhere.
let host = null

class Multicolour_Route_Templates {

  /**
   * Set the multicolour instance for binding.
   * @param {multicolour} target_host for binding.
   * @return {multicolour} host for binding.
   */
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
    return reply[host.request("decorator")](Boom.create(code, err.message ? err.message.toString() : err, { is_error: true }))
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
        // Search for the newly created model.
        this.findOne(model)

          // Auto populate.
          .populateAll()

          // Execute the query.
          .exec((err, models) => {
            err ? Multicolour_Route_Templates.error_reply(err, reply) : reply[host.request("decorator")](models, this).code(202)
          })
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
  static GET(request, reply, code) {
    // Get the query string.
    const qs = request.url.query

    // How many results per page do we want?
    const per_page = host.get("config").get("settings").results.per_page

    // Get which page we're on and remove the meta from the query.
    const page = Number(qs.page) - 1 || 0
    delete qs.page

    // Unless we"re passed an id, then find that one.
    if (request.params.id) {
      qs.id = request.params.id
    }

    // Start building our query.
    this
      // Start with a find query.
      .find(qs)
      // Paginate.
      .skip(Math.abs(page * per_page))
      .limit(per_page)

      // Populate any joins that exist (attributes with the `model` property.)
      .populateAll()

      // Execute the query.
      .exec((err, models) => {
        if (err) {
          Multicolour_Route_Templates.error_reply(err, reply)
        }
        else if (models.length === 0) {
          reply[host.request("decorator")](models, this).code(404)
        }
        else {
          reply[host.request("decorator")](models, this).code(code || 200)
        }
      })
  }

  /**
   * Patch data implies asset update, this function
   * is called with `.bind(Waterline.Collection)`.
   * @bound {Waterline.Collection}
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  static PATCH(request, reply) {
    this.update(request.params.id, request.payload, err => {
      if (err) {
        Multicolour_Route_Templates.error_reply(err, reply)
      }
      else {
        Multicolour_Route_Templates.GET.call(this, request, reply, 202)
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
    this.destroy(request.params.id, (err, model) =>
      err ? Multicolour_Route_Templates.error_reply(err, reply) : reply[host.request("decorator")](model, this).code(202))
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
        Multicolour_Route_Templates.error_reply(err, reply)
      }
      // Check we found models.
      else if (!model || !model.name_key) {
        reply[host.request("decorator")](Boom.notFound("Pending upload failed, could not find `name_key`"))
      }
      // Upload the file.
      else {
        // Upload the file.
        host.request("storage")
          .upload(request.payload.file.path, {
            name: `${model.can_upload_file || "path"}${require("path").extname(request.payload.file.filename)}`
          })
          .on("error", err => Multicolour_Route_Templates.error_reply(err, reply))
          .on("end", () => {
            // Update the model and reply with the updated model.
            this.update({ id: model.id }, { pending: false }, err => {
              if (err) {
                Multicolour_Route_Templates.error_reply(err, reply)
              }
              else {
                Multicolour_Route_Templates.GET.call(this, request, reply, 202)
              }
            })
          })
      }
    })
  }
}

// Export the templates.
module.exports = Multicolour_Route_Templates
