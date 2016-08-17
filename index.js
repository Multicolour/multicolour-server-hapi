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

// Get tools.
const Joi = require("joi")
const chalk = require("chalk")

class Multicolour_Server_Hapi extends Map {
  /**
   * Instantiated by Multicolour to create a HTTP server.
   * @return {Multicolour_Server_Hapi} For immediate object return.
   */
  constructor() {
    super()

    // Get Hapi.
    const hapi = require("hapi")
    const config = this.request("host").get("config")

    // Configure the server with some basic security.
    this.__server = new hapi.Server(config.get("api_server"))

    // Pass our config along to the server.
    this.__server.connection(config.get("api_connections"))

    const host = config.get("api_connections").host || "localhost"
    const port = config.get("api_connections").port || 1811

    this
      .reply("raw", () => this.__server)

      // Set some defaults.
      .reply("csrf_enabled", false)
      .set("did_generate_routes", false)
      .set("validators", [])
      .set("api_root", `http://${host}:${port}`)

    // Check there's an auth config available.
    if (typeof this.request("auth_config") === "undefined") {
      this.reply("auth_config", false)
    }

    // Use the default validator until otherwise set.
    this
      .use(require("./lib/headers"))
      .use(require("./lib/validation"))

      // Register the robots route.
      .use(require("./lib/robots"))

    // Register the flow runner for tests.
    this.set("flow_runner", this.flow_runner.bind(this))

    return this
  }

  flow_runner(task, callback) {
    // Call the flow runner.
    require("./lib/flow_runner").call(this, task, callback)

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

    // Default decorator is JSON.
    this.__server.decorate("reply", "application/json", function(payload) {
      return this.response(payload)
    })
  }

  /**
   * Generate the routes to be registered by this server.
   * @return {Multicolour_Server_Hapi} Object for chaining.
   */
  generate_routes() {
    if (this.get("did_generate_routes") === true) {
      /* eslint-disable */
      console.warn("You asked me to generate_routes when routes are already generated. Skipping...")
      /* eslint-enable */
      return this
    }
    else {
      this.set("did_generate_routes", true)
    }

    // Register the CSRF plugin if enabled.
    if (this.request("csrf_enabled")) {
      /* istanbul ignore next : Not testable */
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

    const validators = this.get("validators")

    // Loop over the models to create the CRUD for each blueprint.
    for (const model_name in models) {
      // Make the below easier to read.
      const model = models[model_name]

      // Get the configured request timeout.
      const request_timeout = host.get("config").get("settings").timeout

      // Create the stuff we'll need.
      const get_route = new Verb_Get(model, headers, auth_name, request_timeout)
      const post_route = new Verb_Post(model, headers, auth_name, request_timeout)
      const patch_route = new Verb_Patch(model, headers, auth_name, request_timeout)
      const delete_route = new Verb_Delete(model, headers, auth_name, request_timeout)
      const put_route = new Verb_Put(model, headers, auth_name, request_timeout)
      const upload_route = new Upload_route(model, headers, auth_name, request_timeout)

      // Routes we generate will be pushed here.
      let routes = []

      // Create routes if we didn't specifically say not to
      // and this model isn't a junction table.
      if (!model.NO_AUTO_GEN_ROUTES && !model.meta.junctionTable) {
        if (model.$_endpoint_class) {
          // Add the standard routes.
          if (model.GET) routes.push(get_route.get_route(validators, headers))
          if (model.POST) routes.push(post_route.get_route(validators, headers))
          if (model.PATCH) routes.push(patch_route.get_route(validators, headers))
          if (model.DELETE) routes.push(delete_route.get_route(validators, headers))
          if (model.PUT) routes.push(put_route.get_route(validators, headers))
        }
        else {
          routes = [
            get_route.get_route(validators, headers),
            post_route.get_route(validators, headers),
            patch_route.get_route(validators, headers),
            delete_route.get_route(validators, headers),
            put_route.get_route(validators, headers)
          ]
        }

        // If this model specifies it can upload files,
        // add the route required.
        if (model.can_upload_file) {
          routes.push(
            upload_route.get_route(this.get("validators"), headers)
          )
        }

        // Register routes.
        this.__server.route(routes)
      }

      // If there are custom routes to load, fire the function with the server.
      if (model.custom_routes) {
        model.custom_routes.call(model, this.__server, host)
      }
    }

    // Trigger an event.
    host.trigger("routes_generated")

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
      /* istanbul ignore next : Not testable */
      console.log("PROD: Not setting up /docs in production.")
      /* eslint-enable */
    }

    // Generate the routes.
    this.generate_routes()

    // Start the server.
    this.__server.start(() => {
      // Tell any listeners the server has started.
      multicolour.trigger("server_started")

      // Set the server root.
      this.set("api_root", this.__server.info.uri)

      // Run the callback
      callback && callback()
    })

    // Exit.
    return this
  }

  /**
   * Stop required services for this plugin.
   * @param  {Function} in_callback to execute when finished.
   * @return {Multicolour_Server_Hapi} Object for chaining.
   */
  stop(callback) {
    const multicolour = this.request("host")

    // Tell any listeners the server is stopping.
    multicolour.trigger("server_stopping")

    // Stop the server.
    this.__server.stop(() => {
      /* eslint-disable */
      console.log(`Server stopped running at: ${this.__server.info.uri}`)
      /* eslint-enable */

      // Run the callback if it exists.
      callback && callback()

      // Tell any listeners the server has stopped.
      multicolour.trigger("server_stopped")
    })

    // Exit.
    return this
  }
}

// Export Multicolour_Server_Hapi for Multicolour to register.
module.exports = Multicolour_Server_Hapi
