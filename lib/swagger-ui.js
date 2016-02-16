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
      register: require("hapi-swagger"),
      options: {
        auth: false,
        info: {
          title: package.name,
          description: package.description,
          version: package.version
        },
        documentationPath: "/docs",
        jsonEditor: true
      }
    }], err => {
    /* istanbul ignore next : Not testable */
    if (err) {
      /* istanbul ignore next : Not testable */
      throw err
    }
  })
}
