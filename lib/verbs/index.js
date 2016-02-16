"use strict"

// Get some tools.
const handlers = require("../handlers")

class Verb {
  /**
   * Set some properties on this verb instance.
   * @param  {String} verb the verb to create a route for.
   * @param  {Waterline.Collection} model to create a route for.
   * @param  {String} auth_strategy_name to use during auth.
   * @return {Verb} Object for chaining.
   */
  constructor(verb, model, auth_strategy_name, request_timeout) {
    this._verb = verb.toUpperCase()
    this._name = model.adapter.identity
    this._model = model
    this._auth_strategy_name = auth_strategy_name
    this._timeout = request_timeout
    return this
  }

  /**
   * Get any auth configuration
   * @return {Object|Boolean} Auth will be false if none, otherwise an object.
   */
  get_auth_config() {
    // If there's no strategy name, just return false.
    if (!this._auth_strategy_name) {
      return false
    }
    // If there's a specific role object
    // for this verb, set it.
    else if (this._model.roles) {
      // Is there a specific roles array for this verb?
      if (this._model.roles[this._verb]) {
        return {
          strategy: this._auth_strategy_name,
          scope: this._model.roles[this._verb]
        }
      }
      // Or is it a global setting for this model/verb?
      else {
        return {
          strategy: this._auth_strategy_name,
          scope: this._model.roles
        }
      }
    }
    else {
      return {
        strategy: this._auth_strategy_name,
        scope: ["user", "admin", "consumer"]
      }
    }
  }

  /**
   * Generate a Hapi route description from
   * this model and it's configuration.
   * @param  {Joi} response_payload to validate with.
   * @return {Object} HapiJS route descriptor.
   */
  get_route(payload, response_payload, headers) {
    // Create the route body.
    const out = {
      method: this._verb,
      path: this._path,
      config: {
        auth: this.get_auth_config(),
        handler: handlers[this._verb].bind(this._model),
        description: this._description,
        notes: this._notes,
        tags: ["api"].concat(this._tags),
        plugins: {
          "hapi-swagger": {
            responses: {
              200: { description: "OK" },
              400: { description: "Bad Request" },
              500: { description: "Server Error" }
            },
            payloadType: "json",
            produces: headers._inner.children
              .filter(header => header.key.toLowerCase() === "accept")[0]
              .schema._valids._set
          }
        },
        validate: {
          payload,
          headers,
          params: this._params
        },
        response: {
          schema: response_payload.meta({
            className: this._class_name
          })
        }
      }
    }

    // If there's a timeout to set
    // and it's not a GET or HEAD
    // request, set the timeout.
    if (this._timeout && !~["get", "head"].indexOf(this._verb.toLowerCase())) {
      out.config.payload = {
        timeout: this._timeout
      }
    }

    return out
  }
}

module.exports = Verb
