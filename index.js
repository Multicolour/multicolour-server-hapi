"use strict"

const debug = require("debug")

// Get our verbs.
const Upload_route = require("./lib/upload-route")
const Verb_Delete = require("./lib/verbs/delete")
const Verb_Get = require("./lib/verbs/get")
const Verb_Post = require("./lib/verbs/post")
const Verb_Put = require("./lib/verbs/put")
const Verb_Patch = require("./lib/verbs/patch")

class Multicolour_Server_Hapi extends Map {
  /**
   * Instantiated by Multicolour to create a HTTP server.
   * @return {Multicolour_Server_Hapi} For immediate object return.
   */
  constructor() {
    super()

    this.debug = debug("multicolour:server-hapi")

    // Get Hapi.
    const hapi = require("hapi")
    const config = this.request("host").get("config")
    const connections_config = config.get("api_connections")

    // Create a default label for us to use internally.
    // Check the labels array exists first though.
    if (!connections_config.hasOwnProperty("labels"))
      connections_config.labels = []

    connections_config.labels.push("multicolour-server-hapi")

    // Configure the server with some basic security.
    this.__server = new hapi.Server(config.get("api_server"))

    // Pass our config along to the server.
    this.__server.connection(connections_config)

    const host = config.get("api_connections").host || "localhost"
    const port = config.get("api_connections").port || 1811

    this
      .reply("raw", () => this.__server)

      // Set some defaults.
      .reply("csrf_enabled", false)
      .set("did_generate_routes", false)
      .set("api_root", `http://${host}:${port}`)

    // Check there's an auth config available.
    if (typeof this.request("auth_config") === "undefined") {
      this.reply("auth_config", false)
    }

    // Use the default validator until otherwise set.
    this
      .use(require("./lib/headers"))

      // Register the robots route.
      .use(require("./lib/robots"))

      // Register the handlers.
      .use(require("./lib/handlers"))

      // Register the rate limiter.
      // .use(require("./lib/rate-limiter"))

    // Parse the query string into an object.
    this.__server.ext("onRequest", (request, reply) => {
      const qs = require("qs")
      const url = require("url")

      const uri = request.raw.req.url
      const parsed = url.parse(uri, false)
      parsed.query = qs.parse(parsed.query)
      request.setUrl(parsed)

      reply.continue()
    })

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

    // Default decorator is plain JSON.
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

    // Get the models from the database instance.
    const models = host.get("database").get("models")

    // Loop over the models to create the CRUD for each blueprint.
    for (const model_name in models) {
      // Make the below easier to read.
      const model = models[model_name]

      // Create the stuff we'll need.
      const get_route = new Verb_Get(this, model)
      const post_route = new Verb_Post(this, model)
      const patch_route = new Verb_Patch(this, model)
      const delete_route = new Verb_Delete(this, model)
      const put_route = new Verb_Put(this, model)
      const upload_route = new Upload_route(this, model)

      // Routes we generate will be pushed here.
      let routes = []

      // Create routes if we didn't specifically say not to
      // and this model isn't a junction table.
      if (!model.NO_AUTO_GEN_ROUTES && !model.meta.junctionTable) {
        if (model.$_endpoint_class) {
          // Add the standard routes.
          if (model.GET) routes.push(get_route.get_route())
          if (model.POST) routes.push(post_route.get_route())
          if (model.PATCH) routes.push(patch_route.get_route())
          if (model.DELETE) routes.push(delete_route.get_route())
          if (model.PUT) routes.push(put_route.get_route())
        }
        else {
          routes = [
            get_route.get_route(),
            post_route.get_route(),
            patch_route.get_route(),
            delete_route.get_route(),
            put_route.get_route()
          ]
        }

        // If this model specifies it can upload files,
        // add the route required.
        if (model.can_upload_file) {
          routes.push(
            upload_route.get_route(host.get("validators"))
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
   * @return {Promise} Promise in resolved state.
   */
  start() {
    // Get the host.
    const multicolour = this.request("host")

    // Get the server.
    const server = this.__server.select("multicolour-server-hapi")

    // Tell any listeners the server is starting.
    multicolour.trigger("server_starting")

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

    // Start the server.
    return new Promise((resolve, reject) => {
      let error_in_routes = false

      try {
        // Generate the routes.
        this.generate_routes()
      } catch(error) {
        console.error(error) // eslint-disable-line

        error_in_routes = true

        // Exit.
        return reject(error)
      }

      // Start the server.
      if (!error_in_routes) {
        this.__server.start()
          .then(() => {
            this.debug("Hapi server started successfully.")

            // Tell any listeners the server has started.
            multicolour.trigger("server_started")

            // Set the server root.
            this.set("api_root", server.info.uri)

            resolve(server)
          })
          .catch(reject)
      }
    })
  }

  /**
   * Stop required services for this plugin.
   * @param  {Function} in_callback to execute when finished.
   * @return {Promise} Promise in resolved state.
   */
  stop() {
    const multicolour = this.request("host")

    // Tell any listeners the server is stopping.
    multicolour.trigger("server_stopping")

    // Stop the server.
    return this.__server.stop()
      .then(() => {
        /* eslint-disable */
        console.log(`Server stopped running at: ${this.__server.select("multicolour-server-hapi").info.uri}`)
        /* eslint-enable */

        // Tell any listeners the server has stopped.
        multicolour.trigger("server_stopped")
      })
      .catch(error => {
        // Tell any listeners the server has stopped.
        multicolour.trigger("server_stopped")

        // Throw the error.
        throw error
      })
  }
}

// Export Multicolour_Server_Hapi for Multicolour to register.
module.exports = Multicolour_Server_Hapi
