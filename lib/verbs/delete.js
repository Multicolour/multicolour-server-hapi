"use strict"

// Get some tools.
const Verb = require("./index")
const Joi = require("joi")

class DELETE extends Verb {
  /**
   * Set some properties on this verb instance.
   * @param  {Waterline.Collection} model to generate route on.
   * @param  {Joi} headers Joi object to validate with.
   * @param  {String} auth_strategy_name to authorise with. [Optional]
   * @return {Verb} Verb for chaining.
   */
  constructor(server, model) {
    // Construct.
    super("DELETE", model, server)

    // Strings for route desription in Swagger.
    this._path = `/${this._name}/{id}`

    if (model.metadata && model.metadata.delete) {
      if (model.metadata.delete.description)
        this._description = model.metadata.delete.description
      else
        this._description = `Delete a "${this._name}".`

      if (model.metadata.delete.notes)
        this._notes = model.metadata.delete.notes
      else
        this._notes = `Delete a "${this._name}" permanently.`
    }
    else {
      this._notes = `Delete a "${this._name}" permanently.`
      this._description = `Delete a "${this._name}".`
    }

    this._class_name = `Delete "${this._name}s"`

    // Properties pertaining to the route.
    this._model = model
    this._tags = [model.adapter.identity, "write"]
    this._params = Joi.object({
      id: Joi.alternatives().try(Joi.string(), Joi.number()).required().description(`ID of particular ${this._name} to delete.`)
    })

    // Return the Verbiage
    return this
  }
}

// Export the class.
module.exports = DELETE
