"use strict"

module.exports = {
  // Where is your content? blueprints, etc
  content: `${__dirname}/`,

  // Configure our servers, api and frontend.
  api_connections: {
    port: 1811,
    host: "localhost",
    routes: {
      cors: {
        origin: [ "http://localhost:1811" ]
      }
    },
    router: { stripTrailingSlash: true }
  },

  api_server: {
    connections: {
      routes: {
        security: true
      }
    },
    debug: { request: ["error"] }
  },

  // Set up our desired database adapter (defaults to Mongo)
  db: {
    adapters: {
      memory: require("sails-memory")
    },
    connections: {
      development: {
        adapter: "memory",
        database: "multicolour"
      }
    }
  }
}
