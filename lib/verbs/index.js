"use strict"

// Get some tools.
const Joi = require("joi")

class Verb {
  /**
   * Set some properties on this verb instance.
   * @param  {String} verb the verb to create a route for.
   * @param  {Waterline.Collection} model to create a route for.
   * @param  {String} auth_strategy_name to use during auth.
   * @return {Verb} Object for chaining.
   */
  constructor(verb, model, server) {
    this._server = server
    this._host = server.request("host")

    // Add the handlers to this instance.
    this._handlers = server.request("handlers")

    // Get the configured request timeout.
    const request_timeout = this._host.get("config").get("settings").timeout

    // Get the auth strategy name.
    const auth_strategy_name = server.request("auth_config")

    this._verb = verb.toUpperCase()
    this._name = model.adapter.identity
    this._model = model
    this._auth_strategy_name = auth_strategy_name
    this._timeout = request_timeout
    this._name = model.adapter.identity
    this.multicolour = model.multicolour_instance
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
  get_response_codes_schemas(validators) {
    // Get the response schemas.
    const payload_alternatives = this.get_response_schemas(validators)
    const error_alternatives = this.get_error_schemas(validators)

    return {
      200: {
        description: "OK",
        schema: payload_alternatives,
      },
      400: {
        description: "Bad Request",
        schema: error_alternatives,
      },
      404: {
        description: "Not Found",
        schema: error_alternatives,
      },
      500: {
        description: "Server Error",
        schema: error_alternatives,
      }
    }
  }

  /**
   * Get the validator's error schemas.
   * @param  {Array[Object]} validators to get schemas from.
   * @return {Array[Joi]} Joi schema.
   */
  get_error_schemas(validators) {
    const alternatives = Joi.alternatives()
    const valids = []

    // Add each valid payload.
    validators.forEach(validator => {
      if (!validator.error_schema) return

      valids.push(validator.error_schema)
    })

    if (valids.length === 0)
      return null

    // Return the alternatives.
    return alternatives.try.apply(alternatives, valids)
  }

  /**
   * There can be many different validators,
   * they can add different content types so
   * get each of their schemas to add to the
   * validation process.
   *
   * @param  {Array<Object>} validators to get response schemas from.
   * @return {Joi} array of joi schemas.
   */
  get_response_schemas(validators) {
    const alternatives = Joi.alternatives()
    const valids = []

    // Add each valid payload.
    validators.forEach(validator => {
      const target = validator.schemas.get[this._name]

      if (!target) return null

      const schema = target.isJoi ? target : Joi.object(target)

      valids.push(schema)
      valids.push(Joi.array().items(schema))
      valids.push(validator.error_schema)
    })

    if (valids.length === 0)
      return Joi.object()

    // Return the alternatives.
    return alternatives.try.apply(alternatives, valids)
  }

  /**
   * There can be many different validators,
   * they can add different content types.
   * @param  {Array[Object]} validators to get payload schemas from.
   * @return {Array[Joi]} array of joi schemas.
   */
  get_payload_schemas(validators) {
    const alternatives = Joi.alternatives()
    const valids = []

    // Add each valid payload.
    validators.forEach(validator => {
      const schema = validator.schemas[this._verb.toLowerCase()][this._name]

      if (!schema) return null

      valids.push(schema)
    })

    if (valids.length === 0)
      return null

    // Return the alternatives.
    return alternatives.try.apply(alternatives, valids)
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
  get_route() {
    const settings = this.multicolour.get("config").get("settings") || {}
    const configured_prefix = settings.route_prefix || ""
    const prefix = configured_prefix.endsWith("/") ? configured_prefix.slice(0, -1) : configured_prefix

    const validators = this._host.get("validators")
    const headers = Joi.object(this._server.request("header_validator").get()).unknown(true)

    // Create the route body.
    const out = {
      method: this._verb,
      path: `${prefix}${this._path}`,
      config: {
        auth: this.get_auth_config(),
        handler: (request, reply) => this._handlers[this._verb](this._model, request, reply),
        description: this._description,
        notes: this._notes,
        tags: ["api"].concat(this._tags),
        plugins: {
          "hapi-swagger": {
            responses: this.get_response_codes_schemas(validators, headers),
            payloadType: "json",
            produces: this.get_produces_array(headers)
          }
        },
        validate: {
          headers,
          params: this._params
        }
      }
    }

    // If there's a timeout to set and it's not a GET or HEAD request, set the timeout.
    // Also add the payload verification since HEAD and GET are read only.
    if (!~["get", "head"].indexOf(this._verb.toLowerCase())) {
      // Add the timeout.
      out.config.payload = { timeout: this._timeout }

      // Add the payload if we can.
      if (this._verb.toLowerCase() !== "delete") {
        const validator = this.get_payload_schemas(validators)

        if (validator)
          out.config.validate.payload = validator.label(`${this._class_name}_payload`)
      }
    }

    return out
  }
}

module.exports = Verb
