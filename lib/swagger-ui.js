module.exports = host => {
  // Get the host of the plugin.
  const multicolour = host.request("host")

  // Get the package details.
  const package = multicolour.get("package")

  // Get the raw Hapi server object.
  const server = multicolour.get("server").request("raw")

  // Register the plugin.
  server.register([
    require("inert"),
    require("vision"),
    {
      register: require("hapi-swaggered"),
      options: {
        info: {
          title: package.name,
          description: package.description,
          version: package.version
        }
      }
    },
    {
      register: require("hapi-swaggered-ui"),
      options: {
        title: package.name,
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
