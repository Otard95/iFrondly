/*jshint esversion: 6 */
/*jshint node: true */

const Song = require('../classes/Song_class.js');

module.exports = function (commands, app) {

  console.log('Loading command module: Playlist...');

  app.db.createDB('playlists').then((res) => {
    console.log('Playlist database first time setup complete:\n'+res.message);
  }).catch((err) => {
    if (err.statusCode == app.db.codes.U_DATABASE_ALLREADY_EXISTS) {
      console.log('Playlist database foud:\n'+err.humanreadable);
    } else {
      console.log('Failed to initialize database:\n'+err.message);
      exit(2);
    }
  });

  let mod = {};

  mod.init = () => {
    commands.add('newPlaylist', (msg, params) => {

      return new Promise((resolve, reject) => {



      });

    }, 1, ['string'], 'newplaylist  -- Creates a new playlist with the name specified.\n' +
                      '             Example:\n' +
                      '              > !newplaylist Gaming // Createds a new empty playlist named \'Gameing\'\n');


    console.log('Done!');

  };

  return mod;
};
