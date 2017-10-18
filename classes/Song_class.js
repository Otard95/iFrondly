/*jshint esversion: 6 */
/*jshint node: true */

const util   = require('../bin/utils.js');
const config = require('../bin/config.json');

module.exports = class Song {

  constructor(url, name, length, originalMessage) {
    this.url = url;
    this.name = util.stringTruncate(name, config.songTitleLength);
    this.leght = length;
    this.originalMessage = originalMessage;
  }

};
