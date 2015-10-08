"use strict"

// Get the path library to resolve where the content is.
const path = require("path")

module.exports = {
  // Where is your content? blueprints, etc
  content: `${__dirname}/`,

  // Are you developing? true or false
  debug: process.env.NODE_ENV !== "production",

  // Configure our servers, api and frontend.
  http: {
    // Configures the REST server.
    api: {
      host: "localhost",
      port: 1811,
      routes: { cors: true },
      router: { stripTrailingSlash: true }
    }
  },

  // Set up our desired database adapter (defaults to Mongo)
  db: {
    adapters: {
      development: null,
      production: null
    },
    connections: {
      development: {
        adapter: "production",
        host: "localhost",
        port: 27017,
        username: "username",
        password: "password",
        database: "multicolour"
      },

      production: {
        adapter: "production",
        host: "localhost",
        port: 27017,
        username: "username",
        password: "password",
        database: "multicolour"
      }
    }
  }
}
