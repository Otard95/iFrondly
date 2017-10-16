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

        app.db.execute('createTable', 'playlists', params[0])
          .then((res) => {

            msg.reply('I creted you new playlist \''+params[0]+'\'.'+
                      ' Use `'+app.config.prefix+'playlistAdd` to add '+
                      'songs to this playlist');
            resolve('Playlist create - Created \''+params[0]+'\'');

          }).catch((err) => {

            if (err.statusCode == app.db.U_TABLE_ALLREADY_EXISTS) {
              // playlist allready exists
              msg.reply('This playlist allready exists. You can add songs to '+
                        'this playlit using `'+app.config.prefix+'playlistAdd`.');
              reject('Playlist create - Failed, playlist allready exists.');
            } else if(err.statusCode == app.db.U_DATABASE_NOT_FOUND) {
              // internal error database not found
              msg.reply('I ran into some problems. Pleace contact my creator.');
              reject('Playlist create - Failed database nor found:\n'+err.message);
            } else {
              //unknown error
              msg.reply('I ran into some problems. Pleace contact my creator.');
              reject('Playlist create - Failed unknown error:\n'+err.message);
            }

          });

      });

    }, 1, ['string'], 'newplaylist -- Creates a new playlist with the name specified.\n' +
                      '                   Example:\n' +
                      '                    > !newplaylist Gaming // Createds a new empty playlist named \'Gameing\'');

    commands.add('playlistAdd', (msg, params) => {

      return new Promise((resolve, reject) => {

        

      });

    }, 2, ['string', 'string'], 'playlistadd -- Adds a song to the specified playlist.\n'+
                                '                   Example:\n'+
                                '                    > !playlistadd playlist_name <youtube url> // adds the song tring the link to the playlist.');


    console.log('Done!');

  };

  return mod;
};
