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
  constructor(model, headers, auth_strategy_name) {
    // Construct.
    super("POST", model, auth_strategy_name)

    // Strings for route desription in Swagger.
    this._path = `/${this._name}`
    this._description = `Create new "${this._name}".`
    this._notes = `Create new ${this._name} with the posted data.`
    this._class_name = `Create ${this._name}s`

    // Properties pertaining to the route.
    this._model = model
    this._headers = headers
    this._auth_strategy_name = auth_strategy_name
    this._tags = [model.adapter.identity, "write"]

    // Return the Verbiage.
    return this
  }
}

// Export the class.
module.exports = POST
