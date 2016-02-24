"use strict"

module.exports = {
  attributes: {
    name: {
      required: true,
      type: "string"
    },
    age: {
      required: true,
      type: "integer",
      min: 0,
      max: 9000
    },

    users: {
      collection: "multicolour_user"
    }
  },

  roles: ["admin"],

  can_upload_file: true,
  custom_routes: () => {}
}
