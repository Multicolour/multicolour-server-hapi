"use strict"

class Multicolour_Rate_Limiter {
  register(host) {
    const settings = host.request("host").get("settings")

    if (!settings)
      return

    const rate_limiting_config = settings.get("rate_limiting")

    if (!rate_limiting_config)
      return

    return host.request("raw")
      .register({
        register: require("hapi-rate-limit"),
        options: rate_limiting_config
      }, err => {
      /* istanbul ignore next : Not testable */
        if (err) {
        /* istanbul ignore next : Not testable */
          throw err
        }
      })
  }
}

module.exports = Multicolour_Rate_Limiter
