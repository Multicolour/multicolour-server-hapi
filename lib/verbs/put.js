"use strict"

// Get some tools.
const Verb = require("./index")
const Joi = require("@hapi/joi")

class PUT extends Verb {
  /**
   * Set some properties on this verb instance.
   * @param  {Waterline.Collection} model to generate route on.
   * @param  {Joi} headers Joi object to validate with.
   * @param  {String} auth_strategy_name to authorise with. [Optional]
   * @return {Verb} Verb for chaining.
   */
  constructor(server, model) {
    // Construct.
    super("PUT", model, server)

    // Strings for route desription in Swagger.
    this._path = `/${this._name}/{id?}`

    if (model.metadata && model.metadata.put) {
      if (model.metadata.put.description)
        this._description = model.metadata.put.description
      else
        this._description = `Update or create a "${this._name}".`

      if (model.metadata.put.notes)
        this._notes = model.metadata.put.notes
      else
        this._notes = `Update or create a "${this._name}".`
    }
    else {
      this._description = `Update or create a "${this._name}".`
      this._notes = `Update or create a "${this._name}".`
    }

    this._class_name = `Update or create ${this._name}s`

    // Properties pertaining to the route.
    this._model = model
    this._tags = [model.model_name, "write"]
    this._params = Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number())
        .optional()
        .description(`ID of particular ${this._name} to update or create [optional]`)
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
      201: {
        description: "Created",
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
module.exports = PUT
