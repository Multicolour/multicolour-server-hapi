"use strict"

module.exports = async function swaggerUIPlugin(host) {
  // Get the host of the plugin.
  const multicolour = host.request("host")

  // Get the package details.
  const pkg = multicolour.get("package")

  // Get the raw Hapi server object.
  const server = host.request("raw")

  // Register the plugin.
  return await server.register([
    require("inert"),
    require("vision"),
    {
      plugin: require("hapi-swagger"),
      options: {
        auth: false,
        info: {
          title: pkg.name,
          description: pkg.description,
          version: pkg.version
        },
        documentationPath: "/docs"
      }
    }])
}
