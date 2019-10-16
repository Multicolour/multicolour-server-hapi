"use strict"

// Get some tools.
const Verb = require("./index")
const Joi = require("@hapi/joi")

class GET extends Verb {
  /**
   * Set some properties on this verb instance.
   * @param  {Waterline.Collection} model to generate route on.
   * @param  {Joi} headers Joi object to validate with.
   * @param  {String} auth_strategy_name to authorise with. [Optional]
   * @return {Verb} Verb for chaining.
   */
  constructor(server, model) {
    // Construct.
    super("GET", model, server)

    // Strings for route desription in Swagger.
    this._path = `/${this._name}/{id?}`

    if (model.metadata && model.metadata.get) {
      if (model.metadata.get.description)
        this._description = model.metadata.get.description
      else
        this._description = `Get a paginated list of "${this._name}s".`

      if (model.metadata.get.notes)
        this._notes = model.metadata.get.notes
      else
        this._notes = `Return a list of "${this._name}s". If an ID is passed, return that document.`
    }
    else {
      this._description = `Get a paginated list of "${this._name}s".`
      this._notes = `Return a list of "${this._name}s". If an ID is passed, return that document.`
    }

    this._class_name = `Get "${this._name}s"`

    // Properties pertaining to the route.
    this._model = model
    this._tags = [model.model_name, "read"]
    this._params = Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number()).description(`ID of particular ${this._name} to get`)
    })

    // Return the Verbiage.
    return this
  }
}

// Export the class.
module.exports = GET
