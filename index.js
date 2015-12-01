"use strict"

// Get the handlers so we can set the host.
const handlers = require("./lib/handlers")

// Get our verbs.
const Verb_Delete = require("./lib/verbs/delete")
const Verb_Get = require("./lib/verbs/get")
const Verb_Post = require("./lib/verbs/post")
const Verb_Put = require("./lib/verbs/put")
const Verb_Patch = require("./lib/verbs/patch")

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
      .reply("decorator", "json")
      .reply("csrf_enabled", true)

    // Check there's an auth config available.
    if (typeof this.request("auth_config") === "undefined") {
      this.reply("auth_config", false)
    }

    // Default decorator.
    this.__server.decorate("reply", "json", function(reply) {
      return this.response(reply)
    })

    // Use the default validator until otherwise set.
    this
      .use(require("./lib/headers"))
      .use(require("./lib/validation"))

    return this
  }

  /**
   * Servers support plugins for things like authentication.
   * @param  {Object} plugin_config in the plugins main exports.
   * @return {multicolour} host of the server.
   */
  use(Plugin) {
    // Get our glorious host.
    const host = this.request("host")

    // Instantiate the plugin.
    const plugin = new Plugin(this)

    // Give the plugin the Talkie interface.
    host.extend(plugin)

    // Make sure the plugin registers any behaviour.
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
    // Register the CSRF plugin if enabled.
    if (this.request("csrf_enabled")) {
      this.use(require("./lib/csrf"))
    }

    // Get the host instance.
    const host = this.request("host")
    handlers.set_host(host)

    // Get the models from the database instance.
    const models = host.get("database").get("models")

    // Get the auth strategy
    const auth_name = this.request("auth_config")

    // Get the headers required to make a request.
    const headers = Joi.object(this.request("header_validator").get()).options({ allowUnknown: true })

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
          method: "PUT",
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
            description: `Upload a file to ${model_name}. Replaces any existing media for this document.`,
            notes: `Upload media to ${model_name}.`,
            tags: ["api", "file_upload", model_name],
            validate: {
              headers,
              payload: Joi.object({
                file: Joi.object().meta({
                  swaggerType: "file"
                })
              }),
              params: Joi.object({
                id: Joi.string().required().description(`ID of the ${model_name} to upload to.`)
              })
            },
            response: {
              schema: response_payload.meta({
                className: `Upload media to ${model_name}`
              })
            }
          }
        })
      }

      // Create routes if we didn't specifically say not to
      // and this model isn't a junction table.
      !model.NO_AUTO_GEN_ROUTES &&
      !model.meta.junctionTable &&
      this.__server.route([
        new Verb_Get(model, headers, auth_name).get_route(null, response_payload, headers),
        new Verb_Post(model, headers, auth_name).get_route(payload, response_payload, headers),
        new Verb_Patch(model, headers, auth_name).get_route(payload, response_payload, headers),
        new Verb_Delete(model, headers, auth_name).get_route(null, response_payload, headers),
        new Verb_Put(model, headers, auth_name).get_route(payload, response_payload, headers)
      ])

      // If there are custom routes to load, fire the function with the server.
      if (model.custom_routes) {
        model.custom_routes.bind(model)(host)
      }
    }

    return this
  }

  /**
   * Start required services for this plugin.
   * @param  {Function} in_callback to execute when finished.
   * @return {Multicolour_Server_Hapi} Object for chaining.
   */
  start(in_callback) {
    // Default the callback, horrible for all
    // code quality processors, pragma the crap out of it..
    /* eslint-disable */
    /* istanbul ignore next : Not testable */
    const callback = in_callback || (() => console.log(`Server running at: ${this.__server.info.uri}`))
    /* eslint-enable */

    // If it's not a production environment,
    // get the Swagger library and it's interface.
    if (process.env.NODE_ENV !== "production") {
      require("./lib/swagger-ui")(this)
    }

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
    // Stop the server.
    this.__server.stop(() => {
      // Say good night.
      if (!in_callback) {
        /* eslint-disable */
        console.log(`Server stopped running at: ${this.__server.info.uri}`)
        /* eslint-enable */
      }
      else {
        in_callback()
      }

      // End the show.
      process.exit(0)
    })

    // Exit.
    return this
  }
}

// Export Multicolour_Server_Hapi for Multicolour
// to register.
module.exports = Multicolour_Server_Hapi
