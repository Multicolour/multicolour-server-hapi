"use strict"

// Get some tools.
const handlers = require("../handlers")
const Joi = require("joi")

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
      if (this._model.roles[this._verb.toLowerCase()]) {
        // Get the scopes.
        const scopes = this._model.roles[this._verb.toLowerCase()]

        // Set the auth.
        return {
          strategy: this._auth_strategy_name,
          scope: scopes.length === 1 ? scopes[0] : scopes
        }
      }
      // Or is it a global setting for this model/verb?
      else {
        return {
          strategy: this._auth_strategy_name,
          scope: this._model.roles.length > 1 ? this._model.roles : this._model.roles[0]
        }
      }
    }
    else {
      return {
        strategy: this._auth_strategy_name
      }
    }
  }

  /**
   * What response codes does this endpoint return?
   * @param  {Joi} model to display.
   * @param  {Joi} headers to display.
   * @return {Object} response config.
   */
  get_response_codes_schemas(validators, headers) {
    // Get the response schemas.
    const alternatives = this.get_response_schemas(validators)

    return {
      "200": {
        description: "OK",
        schema: alternatives,
        headers
      },
      "400": {
        description: "Bad Request",
        schema: alternatives,
        headers
      },
      "404": {
        description: "Not Found",
        schema: alternatives,
        headers
      },
      "500": {
        description: "Server Error",
        schema: alternatives,
        headers
      }
    }
  }

  /**
   * There can be many different validators,
   * they can add different content types.
   * @param  {Array} validators to get response schemas from.
   * @return {Array} array of joi schemas.
   */
  get_response_schemas(validators) {
    const alternatives = Joi.alternatives()
    return alternatives.try.apply(alternatives, validators.map(validator => validator.get_response_schema(this._model)))
  }

  /**
   * There can be many different validators,
   * they can add different content types.
   * @param  {Array} validators to get payload schemas from.
   * @return {Array} array of joi schemas.
   */
  get_payload_schemas(validators) {
    const alternatives = Joi.alternatives()
    return alternatives.try.apply(alternatives, validators.map(validator => validator.get_payload_schema(this._model)))
  }

  /**
   * Get array of content types this server produces.
   * @param  {Joi} headers to extract values from.
   * @return {Array -> String} array of content types, i.e application/json
   */
  get_produces_array(headers) {
    return headers._inner.children
      .filter(header => header.key.toLowerCase() === "accept")[0]
      .schema._valids._set
  }

  /**
   * Generate a Hapi route description from
   * this model and it's configuration.
   * @param  {Joi} response_payload to validate with.
   * @return {Object} HapiJS route descriptor.
   */
  get_route(validators, headers) {
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
            // @TODO: Uncomment this line once
            // https://github.com/glennjones/hapi-swagger/issues/237 is closed
            responses: this.get_response_codes_schemas(validators, headers),
            payloadType: "json",
            produces: this.get_produces_array(headers)
          }
        },
        validate: {
          headers,
          params: this._params
        },
        response: {
          schema: this.get_response_schemas(validators)
            .meta({ className: this._class_name }).label(`${this._class_name}_response`)
        }
      }
    }

    // If there's a timeout to set and it's not a GET or HEAD request, set the timeout.
    // Also add the payload verification since HEAD and GET are read only.
    if (!~["get", "head"].indexOf(this._verb.toLowerCase())) {
      // Add the timeout.
      out.config.payload = { timeout: this._timeout }

      // Add the payload.
      out.config.validate.payload = this.get_payload_schemas(validators).label(`${this._class_name}_payload`)
    }

    return out
  }
}

module.exports = Verb
