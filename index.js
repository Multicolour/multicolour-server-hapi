"use strict"

// Our function templates.
const Functions = require("./lib/handlers")

class Multicolour_Server_Hapi extends Map {
  /**
   * Instantiated by Multicolour to create a HTTP server.
   * @return {Multicolour_Server_Hapi} For immediate object return.
   */
  constructor() {
    super()

    // Get Hapi.
    const hapi = require("hapi")

    // Configure the server with some basic security.
    this.__server = new hapi.Server({
      connections: { routes: { security: true } },
      debug: { request: ["error"] }
    })

    // Pass our config along to the server.
    this.__server.connection(this.request("host").get("config").get("api"))

    // If something wants to extend the underlying
    // server, as per the multicolour plugin spec
    // it exposes a raw reply interface as a function.
    this.reply("raw", () => this.__server)

    // Set some defaults.
    this.reply("auth_name", false)

    return this
  }

  use(plugin_config) {
    // Get our types.
    const host = this.request("host")
    const types = host.get("types")
    const config = host.get("config").get("auth")

    // Instantiate the plugin.
    const plugin = new plugin_config.plugin(this)

    // Give the plugin the Talkie interface.
    host.extend(plugin)

    // Create any added routes by the plugin.
    plugin.register()

    switch(plugin_config.type) {
    case types.AUTH_PLUGIN:
      // Get the token for use in the routes.
      this.reply("auth_plugin", plugin)
      this.set("auth_name", plugin.get("auth_name"))

      // Get the handlers.
      const handlers = plugin.handlers()

      // Create login/register endpoints with the config.
      config.providers.forEach(auth_config => {
        /* istanbul ignore next : Not testable */
        this.__server.route({
          method: ["GET", "POST"],
          path: `/session/${auth_config.provider}`,
          config: {
            auth: {
              strategy: auth_config.provider,
              mode: "try"
            },
            handler: handlers.get("create"),
            description: `Create a new session/user using "${auth_config.provider}"`,
            notes: `Create a new session/user using "${auth_config.provider}"`,
            tags: ["api", "auth", auth_config.provider]
          }
        })
      })

      // Register some auth routes.
      this.__server.route([
        {
          method: "DELETE",
          path: `/session`,
          config: {
            auth: this.request("auth_name"),
            handler: handlers.get("destroy"),
            description: `Delete a session.`,
            notes: `Delete a session permanently.`,
            tags: ["api", "auth"]
          }
        }
      ])
      break
    }

    return host
  }

  generate_routes() {
    // Get the host instance.
    const host = this.request("host")

    // Get Joi.
    const Joi = require("joi")

    // Get the waterline to joi converter.
    const waterline_joi = require("waterline-joi")

    // Get the models from the database instance.
    const models = host.get("database").get("models").collections

    // To extend the blueprints.
    const extend = require("util")._extend

    // These are set in the loop over models.
    /* eslint-disable */
    let model_name, joi_conversion, reply_joi, original_blueprint, model
    /* eslint-enable */

    // Loop over the models to create the CRUD for each blueprint.
    for (model_name in models) {
      // Make the below easier to read.
      model = models[model_name]

      // Clone the blueprint so we don't accidentally modify it.
      // Thanks for pass by reference, JS. Thanks.
      original_blueprint = JSON.parse(JSON.stringify(model._attributes))

      // Remove attributes we didn't define.
      delete original_blueprint.id
      delete original_blueprint.createdAt
      delete original_blueprint.updatedAt

      // Convert the Waterline collection to a Joi validator.
      joi_conversion = waterline_joi(original_blueprint)

      // We need to create a writable schema as well to
      // include other properties like id, createdAt and updatedAt in responses.
      reply_joi = waterline_joi(extend({
        id: model._attributes.id,
        createdAt: model._attributes.createdAt,
        updatedAt: model._attributes.updatedAt
      }, original_blueprint))

      // Create routes.
      this.__server.route([
        {
          method: "GET",
          path: `/${model_name}/{id?}`,
          config: {
            auth: this.request("auth_name"),
            handler: Functions.GET.bind(model),
            description: `Get a paginated list of "${model_name}".`,
            notes: `Return a list of "${model_name}" in the database. If an ID is passed, return matching documents.`,
            tags: ["api", model_name],
            validate: {
              params: Joi.object({
                id: Joi.string().optional().description(`ID of the ${model_name} to get`)
              })
            },
            response: {
              schema: Joi.array().items(reply_joi)
                .meta({
                  className: `Get ${model_name}`
                })
            }
          }
        },
        {
          method: "POST",
          path: `/${model_name}`,
          config: {
            auth: this.request("auth_name"),
            handler: Functions.POST.bind(model),
            description: `Create a new "${model_name}".`,
            notes: `Create a new ${model_name} with the posted data.`,
            tags: ["api", model_name],
            validate: {
              payload: joi_conversion
            },
            response: {
              schema: reply_joi.meta({
                className: `Create ${model_name}`
              })
            }
          }
        },
        {
          method: "PUT",
          path: `/${model_name}/{id}`,
          config: {
            auth: this.request("auth_name"),
            handler: Functions.PUT.bind(model),
            description: `Update a ${model_name}.`,
            notes: `Update a ${model_name} with the posted data.`,
            tags: ["api", model_name],
            validate: {
              payload: joi_conversion,
              params: Joi.object({
                id: Joi.string().required().description(`ID of the ${model_name} to update`)
              })
            },
            response: {
              schema: Joi.array().items(reply_joi).meta({
                className: `Update ${model_name}`
              })
            }
          }
        },
        {
          method: "DELETE",
          path: `/${model_name}/{id}`,
          config: {
            auth: this.request("auth_name"),
            handler: Functions.DELETE.bind(model),
            description: `Delete a ${model_name}.`,
            notes: `Delete a ${model_name} permanently.`,
            tags: ["api", model_name],
            validate: {
              params: Joi.object({
                id: Joi.string().required().description(`ID of the ${model_name} to delete`)
              })
            }
          }
        }
      ])
    }
  }

  /**
   * The plugin may receive messages from it's host,
   * it will receive them here for us to do what we will.
   * @param  {String} type of message.
   * @param  {Any} command to this plugin.
   * @param  {Any} data passed with the command.
   * @return {Multicolour_Server_Hapi} Object for chaining.
   */
  warn(type, command, data) {
    const types = require("multicolour/lib/consts")

    switch (command) {
    case types.SERVER_BOOTUP:
      console.log("Pre-boot warning.", data)
      break

    case types.SERVER_SHUTDOWN:
      console.log("Pre-shutdown warning.", data)
      break
    }
    return this
  }

  /**
   * Start required services for this plugin.
   * @param  {Function} in_callback to execute when finished.
   * @return {Multicolour_Server_Hapi} Object for chaining.
   */
  start(in_callback) {
    // Default the callback.
    /* istanbul ignore next : Not testable */
    const callback = in_callback || (() => console.log(`Server running at: ${this.__server.info.uri}`))

    // Get the Swagger library.
    require("./lib/swagger-ui")(this)

    // Generate the routes.
    this.generate_routes()

    // Start the server.
    this.__server.start(callback)

    // Exit.
    return this
  }

  /**
   * Stop required services for this plugin.
   * @param  {Function} in_callback to execute when finished.
   * @return {Multicolour_Server_Hapi} Object for chaining.
   */
  stop(in_callback) {
    // Default the callback.
    /* istanbul ignore next : Not testable */
    const callback = in_callback || (() => console.log(`Server stopped running at: ${this.__server.info.uri}`))

    // Stop the server.
    this.__server.stop(callback)

    // Exit.
    return this
  }
}

// Export the required config for Multicolour
// to register.
module.exports = {
  // It's a server generator, use that type.
  type: require("multicolour/lib/consts").SERVER_GENERATOR,

  // The generator is the class above.
  generator: Multicolour_Server_Hapi
}
