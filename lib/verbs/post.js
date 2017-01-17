"use strict"

// Get some tools.
const Verb = require("./index")

class POST extends Verb {
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

    // Strings for route desription in Swagger.
    this._path = `/${this._name}`

    if (model.metadata && model.metadata.post) {
      if (model.metadata.post.description)
        this._description = model.metadata.post.description
      else
        this._description = `Create new "${this._name}".`

      if (model.metadata.post.notes)
        this._notes = model.metadata.post.notes
      else
        this._notes = `Create new ${this._name} with the posted data.`
    }
    else {
      this._description = `Create new "${this._name}".`
      this._notes = `Create new ${this._name} with the posted data.`
    }

    this._class_name = `Create ${this._name}s`

    // Properties pertaining to the route.
    this._model = model
    this._tags = [model.adapter.identity, "write"]

    // Return the Verbiage.
    return this
  }

  get_response_codes(model, headers) {
    return {
      200: {
        description: "OK",
        schema: model,
        headers
      },
      201: {
        description: "Created",
        schema: model,
        headers
      },
      400: {
        description: "Bad Request",
        schema: model,
        headers
      },
      404: {
        description: "Not Found",
        schema: model,
        headers
      },
      500: {
        description: "Server Error",
        schema: model,
        headers
      }
    }
  }
}

// Export the class.
module.exports = POST
