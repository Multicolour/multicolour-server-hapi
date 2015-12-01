"use strict"

// Get some tools.
const Verb = require("./index")
const Joi = require("joi")

class GET extends Verb {
  /**
   * Set some properties on this verb instance.
   * @param  {Waterline.Collection} model to generate route on.
   * @param  {Joi} headers Joi object to validate with.
   * @param  {String} auth_strategy_name to authorise with. [Optional]
   * @return {Verb} Verb for chaining.
   */
  constructor(model, headers, auth_strategy_name) {
    // Construct.
    super("GET", model, auth_strategy_name)

    // Strings for route desription in Swagger.
    this._path = `/${this._name}/{id?}`
    this._description = `Get a paginated list of "${this._name}".`
    this._notes = `Return a list of "${this._name}s" in the database. If an ID is passed, return that document.`
    this._class_name = `Get ${this._name}s`

    // Properties pertaining to the route.
    this._model = model
    this._headers = headers
    this._auth_strategy_name = auth_strategy_name
    this._tags = [model.adapter.identity, "read"]
    this._params = Joi.object({ id: Joi.string().description(`ID of particular ${this._name} to get`) })

    // Return the Verbiage.
    return this
  }
}

// Export the class.
module.exports = GET
