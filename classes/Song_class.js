/*jshint esversion: 6 */
/*jshint node: true */

const util   = require('../bin/utils.js');
const config = require('../bin/config.json');

module.exports = class Song {

  constructor(url, name, length, originalMessage, vidID) {// originalMessage and vidID is optional
    if (typeof originalMessage == 'string'){
      vidID = originalMessage;
      originalMessage = undefined;
    }
    this.url = url;
    this.name = util.stringTruncate(name, config.songTitleLength);
    this.leght = length;
    this.originalMessage = originalMessage;
    this.vidID = vidID;
  }

};
