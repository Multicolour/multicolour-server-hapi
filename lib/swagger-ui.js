module.exports = server => {
  server.register([
    require("inert"),
    require("vision"),
    {
      register: require("hapi-swaggered"),
      options: {
        info: {
          title: "Example API",
          description: "Powered by node, hapi, joi, hapi-swaggered, hapi-swaggered-ui and swagger-ui",
          version: "1.0"
        }
      }
    },
    {
      register: require("hapi-swaggered-ui"),
      options: {
        title: "Example API",
        path: "/docs",
        authorization: {
          field: "apiKey",
          scope: "query", // header works as well
          // valuePrefix: "bearer "// prefix incase
          defaultValue: "demoKey",
          placeholder: "Enter your apiKey here"
        },
        swaggerOptions: {
          validatorUrl: null
        }
      }
    }], err => {
      if (err) {
        throw err
      }
    })
}
