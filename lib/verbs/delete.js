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

    if (model.metadata && model.metadata.description)
      this._description = model.metadata.description
    else
      this._description = `Delete a "${this._name}".`

    if (model.metadata && model.metadata.notes)
      this._notes = model.metadata.notes
    else
      this._notes = `Delete a "${this._name}" permanently.`

    this._class_name = `Delete "${this._name}s"`

    // Properties pertaining to the route.
    this._model = model
    this._tags = [model.adapter.identity, "write"]
    this._params = Joi.object({ id: Joi.string().required().description(`ID of particular ${this._name} to delete.`) })

    // Return the Verbiage.
    return this
  }
}

// Export the class.
module.exports = DELETE
