"use strict"

// Get the handlers so we can set the host.
const handlers = require("./lib/handlers")

// Get our verbs.
const Upload_route = require("./lib/upload-route")
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
      .reply("raw", () => this.__server)

      // Set some defaults.
      .reply("csrf_enabled", false)

    // Check there's an auth config available.
    if (typeof this.request("auth_config") === "undefined") {
      this.reply("auth_config", false)
    }

    // Default decorator.
    this.__server.decorate("reply", "application/json", function(reply) {
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
    const headers = Joi.object(this.request("header_validator").get()).unknown(true)

    // Loop over the models to create the CRUD for each blueprint.
    for (const model_name in models) {
      // Make the below easier to read.
      const model = models[model_name]

      // Convert the Waterline collection to a Joi validator.
      const payload = this.get("validator").request("payload_schema", model)

      // We need to create a writable schema as well to
      // include other properties like id, createdAt and updatedAt in responses.
      const response_payload = this.get("validator").request("response_schema", model)

      // Get the configured request timeout.
      const request_timeout = host.get("config").get("settings").timeout

      // Create routes if we didn't specifically say not to
      // and this model isn't a junction table.
      if (!model.NO_AUTO_GEN_ROUTES && !model.meta.junctionTable) {
        // Add the standard routes.
        this.__server.route([
          new Verb_Get(model, headers, auth_name, request_timeout).get_route(null, response_payload, headers),
          new Verb_Post(model, headers, auth_name, request_timeout).get_route(payload, response_payload, headers),
          new Verb_Patch(model, headers, auth_name, request_timeout).get_route(payload, response_payload, headers),
          new Verb_Delete(model, headers, auth_name, request_timeout).get_route(null, Joi.object(), headers),
          new Verb_Put(model, headers, auth_name, request_timeout).get_route(payload, response_payload, headers)
        ])

        // If this model specifies it can upload files,
        // add the route required.
        if (model.can_upload_file) {
          this.__server.route([
            new Upload_route(model, headers, auth_name, request_timeout).get_route(payload, response_payload, headers)
          ])
        }
      }

      // If there are custom routes to load, fire the function with the server.
      if (model.custom_routes) {
        model.custom_routes.call(model, this.__server, host)
      }

      // Trigger an event.
      host.trigger("routes_generated")
    }

    return this
  }

  /**
   * Start required services for this plugin.
   * @param  {Function} in_callback to execute when finished.
   * @return {Multicolour_Server_Hapi} Object for chaining.
   */
  start(in_callback) {
    // Get the host.
    const multicolour = this.request("host")

    // Tell any listeners the server is starting.
    multicolour.trigger("server_starting")

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
    else {
      /* eslint-disable */
      console.log("PROD: Not setting up /docs in production.")
      /* eslint-enable */
    }

    // Generate the routes.
    this.generate_routes()

    // Start the server.
    this.__server.start(() => {
      // Tell any listeners the server has started.
      multicolour.trigger("server_started")

      // Run the callback
      callback()
    })

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
      /* eslint-disable */
      console.log(`Server stopped running at: ${this.__server.info.uri}`)
      /* eslint-enable */

      // Run the callback if it exists.
      in_callback && in_callback()

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
