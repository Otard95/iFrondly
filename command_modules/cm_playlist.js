/*jshint esversion: 6 */
/*jshint node: true */

const Song = require('../classes/Song_class.js');

module.exports = function (commands, app) {

  let mod = {};

  mod.init = () => {
    commands.add('newPlaylist', (msg, params) => {



    }, 1, ['string'], 'newplaylist  -- Creates a new playlist with the name specified.\n' +
                      '             Example:\n' +
                      '              > !newplaylist Gaming // Createds a new empty playlist named \'Gameing\'\n');

    return mod;
  };
};
