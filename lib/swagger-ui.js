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
        auth: false,
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
        auth: false,
        authorization: {
          field: "Authorization",
          scope: "header",
          valuePrefix: "Bearer ",
          defaultValue: "Enter your API key here",
          placeholder: "Enter your API key here"
        },
        swaggerOptions: {
          validatorUrl: null
        }
      }
    }], err => {
    /* istanbul ignore next : Not testable */
    if (err) {
      /* istanbul ignore next : Not testable */
      throw err
    }
  })
}
