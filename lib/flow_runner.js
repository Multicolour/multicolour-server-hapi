"use strict"

const chalk = require("chalk")

module.exports = function flow_runner(task, callback) {
  const Async = require("async")
  const validators = this.get("validators")
  const method = task.verb.toString().toUpperCase()
  const non_create_write_verbs = new Set(["put", "patch", "delete"])

  Async.parallel(validators.map(validator => next => {
    // Get the validator.
    const header_validator = validator.request("header_validator")
    const headers = {}

    // Get a printable name.
    const validator_name_printable = chalk.green(validator.constructor.name)

    // Set the headers.
    Object.keys(header_validator._headers).forEach(header => {
      const value = header_validator._headers[header]
      if (typeof value._flags !== "undefined")
        headers[header] = value._flags.default
    })

    let url = "/" + task.model
    const search = Object.assign({}, task.search)

    // If the verb wasn't to create but was to update
    // create a new url
    if (
      non_create_write_verbs.has(task.verb) ||
      task.verb.toLowerCase() === "get"
    ) {
      url = `/${task.model}/${search.id || ""}`
    }

    delete search.id

    let query = require("querystring").stringify(search)

    // Create the payload to send to Hapi.
    const payload = { url, method, headers, query }

    // If it's not a get request, add the payload.
    if (method !== "GET") payload.payload = task.payload

    // Make the request.
    this.__server.inject(payload, response => {
      const validators = {
        code: code => code >= 200 && code < 400,
        res: res => !!res
      }

      const errors = []

      // Override the defaults with any expected definitions.
      if (task.hasOwnProperty("expected"))
        Object.assign(validators, task.expected)

      // Validate the response.
      const code = validators.code(response.statusCode)
      const res = validators.res(response.result)
      const printable_payload = task.payload ? chalk.yellow.italic(JSON.stringify(task.payload)) : ""

      // Check for errors.
      if (!code)
        errors.push({ payload: JSON.stringify(payload), expected: validators.code.toString(), actual: response.statusCode })
      /* istanbul ignore next : Not testable */
      if (!response)
        errors.push({ payload: JSON.stringify(payload), expected: validators.response.toString(), actual: JSON.stringify(res.result) })

      // Show output.
      /* eslint-disable */
      if (errors.length > 0) {
        console.log(`👎  ${chalk.red.bold.underline("FAILED:")} ${chalk.blue.bold(method)}:${validator_name_printable} ${chalk.white(url)} ${printable_payload}`)
        next(errors, null)
      }
      else {
        console.log(`👍  ${chalk.green.bold.underline("SUCCESS:")} ${chalk.blue.bold(method)}:${validator_name_printable} ${chalk.white(url)} ${printable_payload}`)
        next(null, task)
      }
      /* eslint-enable */
    })
  }), callback)

  return this
}
