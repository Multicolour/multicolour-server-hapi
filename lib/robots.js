"use strict"

class Robots_TXT_Route {
  register(Multicolour_Server_Hapi) {
    Multicolour_Server_Hapi.request("raw").route([
      {
        method: "GET",
        path: "/ROBOTS.txt",
        config: {
          auth: false,
          handler: (request, reply) => {
            reply([
              "User-agent: Googlebot",
              "Disallow:",
              "",
              "User-agent: *",
              "Disallow: /"
            ].join("\n")).type("text/plain")
          }
        }
      }
    ])
  }
}

module.exports = Robots_TXT_Route
