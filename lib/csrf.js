"use strict"

// Get our tools.
const Joi = require("joi")

class Multicolour_CSRF_Token {
  /**
   * Register this plugin with hapijs.
   * @param  {Hapi.Server} server to register this plugin to.
   * @return {void}
   */
  register(multicolour_server) {
    // Get the server.
    const server = multicolour_server.request("raw")

    // Register the plugin.
    server.register({
      plugin: require("crumb"),
      options: {
        restful: true
      }
    })
      .catch(err => {
        if (err) {
          throw err
        }
      })

    // Set the csrf token header validator.
    multicolour_server.request("header_validator")
      .set("x-csrf-token", Joi.string().required().description("The CSRF token to validate."))

    // Make sure, before we respond we add the CSRF token.
    server.ext("onPreResponse", (request, reply) => {
      // Make sure we set the x-csrf-token regardless of
      // whether it was an error or a successful request.
      if (request.response.isBoom) {
        request.response.output.headers["x-csrf-token"] = request.plugins.crumb
      }
      else {
        request.response.header("x-csrf-token", request.plugins.crumb)
      }

      // Continue with the reply.
      reply.continue()
    })

    // Create a route to get a new CSRF token.
    server.route({
      method: "GET",
      path: "/csrf",
      config: {
        auth: false,
        handler: (request, reply) => reply({ crumb: request.plugins.crumb }),
        description: "Get a CSRF token.",
        notes: "Get a valid CSRF token for future requests",
        tags: ["api", "csrf"],
        response: {
          schema: Joi.object({ crumb: Joi.string().required() })
            .meta({ className: "Get a CSRF token" })
        }
      }
    })
  }
}

module.exports = Multicolour_CSRF_Token
