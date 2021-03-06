"use strict"

// Get some tools.
const Verb = require("./verbs/index")
const Joi = require("@hapi/joi")

class Upload_route extends Verb {
  /**
   * Set some properties on this verb instance.
   * @param  {Waterline.Collection} model to generate route on.
   * @param  {Joi} headers Joi object to validate with.
   * @param  {String} auth_strategy_name to authorise with. [Optional]
   * @return {Verb} Verb for chaining.
   */
  constructor(server, model) {
    // Construct.
    super("POST", model, server)

    // Add the handlers to this instance.
    this._handlers = server.request("handlers")

    // Strings for route desription in Swagger.
    this._path = `/${this._name}/{id}/upload`
    this._description = `Upload media to a "${this._name}".`
    this._notes = `Upload media to a "${this._name}".`
    this._class_name = `Upload media to a "${this._name}".`

    // Properties pertaining to the route.
    this._model = model
    this._tags = [model.model_name, "write"]
    this._params = Joi.object({ id: Joi.string().required().description(`ID of particular "${this._name}" to add media to.`) })

    // Return the Verbiage.
    return this
  }

  get_route(validators, headers) {
    return {
      method: "POST",
      path: this._path,
      config: {
        auth: this.get_auth_config(),
        plugins: {
          "hapi-swagger": {
            payloadType: "form"
          }
        },
        payload: {
          allow: "multipart/form-data",
          maxBytes: process.env.MAX_FILE_UPLOAD_BYTES || 21e7,
          output: "file",
          parse: true,
          timeout: this._timeout
        },
        handler: (request, reply) => this._handlers.UPLOAD(this._model, request, reply),
        description: this._description,
        notes: this._notes,
        tags: ["api", "file_upload"].concat(this._tags),
        validate: {
          headers,
          payload: Joi.object({
            file: Joi.object().meta({ swaggerType: "file" })
          }),
          params: this._params
        },
        response: {
          schema: Joi.alternatives().try(this.get_response_schemas(validators))
            .meta({ className: `Upload media to ${this._name}` })
        }
      }
    }
  }
}

// Export the class.
module.exports = Upload_route
