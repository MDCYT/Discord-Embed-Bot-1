/**
 * Any Bot's custom Command class
 */
class Slash {
  /**
   * Create new command
   * @param {Client} client
   * @param {Object} options
   */
  constructor(client, options) {
    /**
     * The client
     * @type {Client}
     */
    this.client = client;

    /**
     * Data
     * @type { Array }
     */
    this.data = options.data;

    /**
     * Name of the command
     * @type {string}
     */
    this.name = options.name;
  }
}

module.exports = Slash;
