"use strict"

// Our function templates.
const Functions = require("./lib/handlers")

// To extend the blueprints.
const extend = require("util")._extend

class Multicolour_Server_Hapi {
  /**
   * Instantiated by Multicolour to create a HTTP server.
   * @return {Multicolour_Server_Hapi} For immediate object return.
   */
  constructor() {
    // Get Hapi.
    const hapi = require("hapi")

    // Configure the server with some basic security.
    this.__server = new hapi.Server({
      connections: { routes: { security: true } }
    })

    // Pass our config along to the server.
    this.__server.connection(this.request("host").get("config").get("api"))

    // If something wants to extend the underlying
    // server, as per the multicolour plugin spec
    // it exposes a raw reply interface as a function.
    this.reply("raw", () => this.__server)

    return this
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

    // These are set in the loop over models.
    /* eslint-disable */
    let model_name, joi_conversion, reply_joi, original_blueprint
    /* eslint-enable */

    // Loop over the models to create the CRUD for each blueprint.
    for (model_name in models) {
      // Thanks for pass by reference, JS. Thanks.
      original_blueprint = JSON.parse(JSON.stringify(models[model_name]._attributes.blueprint))

      // Convert the Waterline collection to a Joi validator.
      joi_conversion = waterline_joi(models[model_name]._attributes.blueprint)

      // We need to create a writable schema as well to
      // include other properties like id, createdAt and updatedAt in responses.
      reply_joi = waterline_joi(extend(models[model_name].definition, original_blueprint))

      // Create routes.
      this.__server.route([
        {
          method: "GET",
          path: `/${model_name}/{id?}`,
          config: {
            handler: Functions.GET.bind(models[model_name]),
            description: `Get a paginated list of "${model_name}"`,
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
            handler: Functions.POST.bind(models[model_name]),
            description: `Create a new "${model_name}"`,
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
            handler: Functions.PUT.bind(models[model_name]),
            description: `Update a ${model_name}`,
            notes: `Update a ${model_name} with the posted data.`,
            tags: ["api", model_name],
            validate: {
              payload: joi_conversion,
              params: Joi.object({
                id: Joi.string().required()
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
            handler: Functions.DELETE.bind(models[model_name]),
            description: `Delete a ${model_name}`,
            notes: `Delete a ${model_name} permanently.`,
            tags: ["api", model_name],
            validate: {
              params: Joi.object({
                id: Joi.string().required()
              })
            }
          }
        }
      ])
    }
  }

  warn(type, data) {
    const types = require("multicolour/lib/consts")

    switch (data) {
    case types.SERVER_BOOTUP:
      console.log("Pre-boot warning.")
      break

    case types.SERVER_SHUTDOWN:
      console.log("Pre-shutdown warning.")
      break
    }
    return this
  }

  start(callback) {
    // Get the Swagger library.
    require("./lib/swagger-ui")(this)

    // Generate the routes.
    this.generate_routes()

    // Start the server.
    this.__server.start(callback)

    // Exit.
    return this
  }

  stop(callback) {
    // Stop the server.
    this.__server.stop()
    callback()
    return this
  }
}

// Export the required config for Multicolour
// to register.
module.exports = host => {
  return {
    // It's a server generator, use that type.
    type: host.get("types").SERVER_GENERATOR,

    // The generator is the class above.
    generator: Multicolour_Server_Hapi
  }
}
