"use strict"

// Get our tools.
const Joi = require("joi")

// Create a function to register with.
module.exports = server => {
  server.register({
    register: require("crumb"),
    options: {
      restful: true
    }
  }, err => {
    if (err) {
      throw err
    }
  })

  // Make sure, before we respond we add the CSRF token.
  server.ext("onPreResponse", (request, reply) => {
    // Make sure we set the X-CSRF-Token regardless of
    // whether it was an error or a successful request.
    if (request.response.isBoom) {
      request.response.output.headers["X-CSRF-Token"] = request.plugins.crumb
    }
    else {
      request.response.header("X-CSRF-Token", request.plugins.crumb)
    }

    // Continue with the reply.
    reply.continue()
  })

  // Create a route to get a new CSRF token.
  server.route({
    method: "GET",
    path: `/csrf`,
    config: {
      handler: (request, reply) => reply({ crumb: request.plugins.crumb }),
      description: `Get a CSRF token.".`,
      notes: `Get a valid CSRF token for future requests`,
      tags: ["api", "csrf"],
      response: {
        schema: Joi.object({
          crumb: Joi.string().required()
        })
          .meta({
            className: `Get CSRF`
          })
      }
    }
  })
}
