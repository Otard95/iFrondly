/*jshint esversion: 6 */
/*jshint node: true */

const Song = require('../classes/Song_class.js');

module.exports = function (commands, app) {

  let mod = {};

  mod.init = () => {
    commands.add('newPlaylist', (msg, params) => {

      

    }, 1, ['string'], 'play  -- Plays music form the queue or the link(youtube) specified.\n' +
                      '             Example:\n' +
                      '              > !play // plays the current song or the next from queue\n' +
                      '              > !play https://www.youtube.com/watch?v=KbNXnxwMOqU // plays the song from the link');

    return mod;
  };
};
