"use strict"

class crud {
  /**
   * Construct
   * @param  {[type]} blueprint [description]
   * @return {[type]}           [description]
   */
  constructor(blueprint) {

  }

  to_hapi_route() {
    return {
      method: this.method.toUpperCase(),
      path: this.path.toString(),
      config: {
        
      }
    }
  }
}
