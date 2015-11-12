"use strict"

// Our function templates.
const Functions = require("./lib/handlers")
const Default_validator = require("./lib/validation")

// Get Joi.
const Joi = require("joi")

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
    this.__server = new hapi.Server(this.request("host").get("config").get("api_server"))

    // Pass our config along to the server.
    this.__server.connection(this.request("host").get("config").get("api_connections"))

    this
    // If something wants to extend the underlying
    // server, as per the multicolour plugin spec
    // it exposes a raw reply interface as a function.
      .reply("raw", () => this.__server)

      // Set some defaults.
      .reply("auth_name", false)
      .reply("decorator", "json")
      .reply("csrf_enabled", true)

    // Default decorator.
    this.__server.decorate("reply", "json", function(reply) {
      return this.response(reply)
    })

    // Use the default validator until otherwise set.
    this.use(Default_validator)

    return this
  }

  /**
   * Servers support plugins for things like authentication.
   * @param  {Object} plugin_config in the plugins main exports.
   * @return {multicolour} host of the server.
   */
  use(Plugin) {
    // Get our types.
    const host = this.request("host")

    // Instantiate the plugin.
    const plugin = new Plugin(this)

    // Give the plugin the Talkie interface.
    host.extend(plugin)

    // Create any added routes by the plugin.
    plugin.register(this)

    return this
  }

  /**
   * Register names, properties or anything helpful
   * against the base multicolour instance.
   * @param  {Multicolour} multicolour instance this plugin is registering to.
   * @return {void}
   */
  register(multicolour) {
    multicolour.set("server", this)
  }

  /**
   * Generate the routes to be registered by this server.
   * @return {Multicolour_Server_Hapi} Object for chaining.
   */
  generate_routes() {
    // Get the host instance.
    const host = this.request("host")

    // Set the host for the handler templates.
    Functions.set_host(host)

    // Get the models from the database instance.
    const models = host.get("database").get("models")

    // Get the auth strategy
    const auth = this.request("auth_names")

    // The headers required to make a request.
    let headers

    // Register the CSRF plugin.
    if (this.request("csrf_enabled")) {
      require("./lib/csrf-register")(this.__server)

      headers = Joi.object({
        "x-csrf-token": Joi.string().required()
      }).options({ allowUnknown: true })
    }

    // Loop over the models to create the CRUD for each blueprint.
    for (const model_name in models) {
      // Make the below easier to read.
      const model = models[model_name]

      // Convert the Waterline collection to a Joi validator.
      const payload = this.get("validator").request("payload_schema", model)

      // We need to create a writable schema as well to
      // include other properties like id, createdAt and updatedAt in responses.
      const response_payload = this.get("validator").request("response_schema", model)

      // Work out whether it's a file upload or not.
      if (model.can_upload_file) {
        // Add an upload endpoint.
        this.__server.route({
          method: "PATCH",
          path: `/${model_name}/{id}/upload`,
          config: {
            auth,
            payload: {
              allow: "multipart/form-data",
              maxBytes: process.env.MAX_FILE_UPLOAD_BYTES || 209715200,
              output: "file",
              parse: true
            },
            handler: Functions.UPLOAD.bind(model),
            description: `Upload a file to ${model_name}.`,
            notes: `Upload media to ${model_name}.`,
            tags: ["api", "file_upload", model_name],
            validate: {
              payload: Joi.object({
                file: Joi.object().meta({
                  swaggerType: "file"
                })
              }),
              params: Joi.object({
                id: Joi.string().required().description(`ID of the ${model_name} to upload to.`)
              }),
              headers
            },
            response: {
              schema: Joi.array().items(response_payload).meta({
                className: `Upload media to ${model_name}`
              })
            }
          }
        })
      }

      // Create routes if we didn't specifically say not to.
      !model.NO_AUTO_GEN_ROUTES && this.__server.route([
        {
          method: "GET",
          path: `/${model_name}`,
          config: {
            auth,
            handler: Functions.GET.bind(model),
            description: `Get a paginated list of "${model_name}".`,
            notes: `Return a list of "${model_name}" in the database. If an ID is passed, return matching documents.`,
            tags: ["api", model_name],
            validate: { headers },
            response: {
              schema: Joi.array().items(response_payload)
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
            auth,
            handler: Functions.POST.bind(model),
            description: `Create new "${model_name}".`,
            notes: `Create new ${model_name} with the posted data.`,
            tags: ["api", model_name],
            validate: {
              payload,
              headers
            },
            response: {
              schema: response_payload.meta({
                className: `Create ${model_name}`
              })
            }
          }
        },
        {
          method: "PATCH",
          path: `/${model_name}/{id}`,
          config: {
            auth,
            handler: Functions.PATCH.bind(model),
            description: `Update ${model_name}.`,
            notes: `Update ${model_name} with the posted data.`,
            tags: ["api", model_name],
            validate: {
              payload,
              params: Joi.object({
                id: Joi.string().required().description(`ID of the ${model_name} to update`)
              }),
              headers
            },
            response: {
              schema: Joi.array().items(response_payload).meta({
                className: `Update ${model_name}`
              })
            }
          }
        },
        {
          method: "DELETE",
          path: `/${model_name}/{id}`,
          config: {
            auth,
            handler: Functions.DELETE.bind(model),
            description: `Delete ${model_name}.`,
            notes: `Delete ${model_name} permanently.`,
            tags: ["api", model_name],
            validate: {
              params: Joi.object({
                id: Joi.string().required().description(`ID of the ${model_name} to delete`)
              }),
              headers
            }
          }
        }
      ])

      // If there are custom routes to load, fire the function with the server.
      if (model.custom_routes) {
        model.custom_routes.bind(model)(host)
      }
    }

    return this
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
      break

    case types.SERVER_SHUTDOWN:
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
    /* eslint-disable */
    /* istanbul ignore next : Not testable */
    const callback = in_callback || (() => console.log(`Server running at: ${this.__server.info.uri}`))
    /* eslint-enable */

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
    /* eslint-disable */
    /* istanbul ignore next : Not testable */
    const callback = in_callback || (() => console.log(`Server stopped running at: ${this.__server.info.uri}`))
    /* eslint-enable */

    // Stop the server.
    this.__server.stop(callback)

    // Exit.
    return this
  }
}

// Export Multicolour_Server_Hapi for Multicolour
// to register.
module.exports = Multicolour_Server_Hapi
