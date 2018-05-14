"use strict"

module.exports = {
  "api_connections": {
    "host": "localhost",
    "port": 1811,
    "routes": {
      "cors": {
        "origin": [
          "*"
        ]
      }
    },
    "router": {
      "stripTrailingSlash": true
    }
  },
  "content": "./content",
  "db": {
    "adapters": {
      "development": require("sails-memory"),
      "production": require("sails-memory")
    },
    "connections": {
      "development": {
        "adapter": "development",
        "database": "server"
      },
      "production": {
        "adapter": "production",
        "database": "server"
      }
    }
  }
}
