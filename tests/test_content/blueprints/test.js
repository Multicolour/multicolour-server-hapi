"use strict"

module.exports = {
  blueprint: {
    name: {
      required: true,
      type: "string"
    },
    age: {
      required: true,
      type: "number",
      min: 0,
      max: 9000 // OVER 9000!???!!!
    }
  }
}
