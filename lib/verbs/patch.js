"use strict"

// Get some tools.
const Verb = require("./index")
const Joi = require("@hapi/joi")

class PATCH extends Verb {
  /**
   * Set some properties on this verb instance.
   * @param  {Waterline.Collection} model to generate route on.
   * @param  {Joi} headers Joi object to validate with.
   * @param  {String} auth_strategy_name to authorise with. [Optional]
   * @return {Verb} Verb for chaining.
   */
  constructor(server, model) {
    // Construct.
    super("PATCH", model, server)

    // Strings for route desription in Swagger.
    this._path = `/${this._name}/{id}`

    if (model.metadata && model.metadata.patch) {
      if (model.metadata.patch.description)
        this._description = model.metadata.patch.description
      else
        this._description = `Update a "${this._name}".`

      if (model.metadata.patch.notes)
        this._notes = model.metadata.patch.notes
      else
        this._notes = `Update a "${this._name}".`
    }
    else {
      this._description = `Update a "${this._name}".`
      this._notes = `Update a "${this._name}".`
    }

    this._class_name = `Update ${this._name}s`

    // Properties pertaining to the route.
    this._model = model
    this._tags = [model.model_name, "write"]
    this._params = Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number())
        .required()
        .description(`ID of particular ${this._name} to update.`)
    })

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
      202: {
        description: "Accepted/Updated",
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
module.exports = PATCH
