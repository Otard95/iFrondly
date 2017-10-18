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

        // check is playlist exists
        app.db.execute('select', 'playlists', params[0]).catch((err) => {
          if (err.statusCode == app.db.codes.U_TABLE_NOT_FOUND) {
            msg.reply('That playlist doesn\'t exits. '+
                      'You can create a new playlist using the `'+
                      app.config.prefix+'newPlaylist` command.');
            reject('Playlist add - failed, no such playlist');
            return;
          }
        });

        let songs = []; // objects of class Song
        // list of links provided from user
        let songLinks = params.slice(1, params.length);
        let promises = []; // pending promises
        let failed = []; // the urls ov the songs that could not be added
        let duplicates = []; // list of names that are duplicates of
                            // existing songs in the database
        let inserted = 0; // couter for the number of songs that
                          // successfully was added to the database

        function getSongInfo(url) {
          return new Promise((resolveInner, rejectInner) => {
            app.yt.getInfo(url, (err, info) => {
              if (err) {
                failed.push(url);
                resolveInner();
                return;
              }
              let s = new Song(url,
                               info.title,
                               info.length_seconds);
              songs.push(s);
              resolveInner();
            });
          });
        }

        function insertSong(song) {
          return new Promise((resolveInner, rejectInner) => {
            app.db.execute('insert',
                           'playlists',
                           params[0],
                           songs[i])
              .then((res) => {
                inserted++;
                resolveInner();
              }).catch((err) => {
                if (err.statusCode == app.db.codes.U_ROW_DUPLICATE) {
                  duplicates.push(song.name);
                } else {
                  failed.push(song.url);
                }
                resolveInner();
              });
          });
        }

        for (let i = 0; i < songLinks.length; i++) {
          promises.push(getSongInfo(songLinks[i]));
        }

        Promise.all(promises).then((res) => {

          // add a equals methud to the song object
          for (let i = 0; i < songs.length; i++) {
            songs[i].equals = (obj1, obj2) => obj1.url == obj2.url;
          }

          // insert songs
          promises = [];
          for (let i = 0; i < songs.length; i++) {
            promises.push(insertSong(songs[i]));
          }

          Promise.all(promises).then((res) => {
            // if any song could not be added,
            // generate a message to tell the user
            let msgFailed = 'I was unable to add '+
            failed.length > 1 ? 'these':'this'+
            'song'+failed.length > 1 ? 's:\n  - ':'';

            for (let i = 0; i < failed.length; i++) {
              msgFailed += failed[i] + '\n  - ';
            }

            msgFailed = msgFailed.substr(0,msgFailed.length-4);

            msgDuplicates = '';
            if (duplicates.length > 1) {
              msgDuplicates = 'These songs are allready in the playlist:\n';
              for (let i = 0; i < duplicates.length; i++) {
                msgDuplicates += '  - ' + duplicates[i];
              }
            } else if (duplicates.length == 1) {
              msgDuplicates = duplicates[0] + ' is allready in the playlist';
            }

            msg.reply('Added '+
                      inserted+' of '+songLinks.length+
                      ' song'+(songLinks.length > 1 ? 's' : '')+
                      ' to playlist \''+params[0]+'\''+
                      failed.length     > 0 ? '\n' + msgFailed : ''+
                      duplicates.length > 0 ? '\n' + msgDuplicates : '');

            resole('Add song'+(inserted > 1 ? 's' : '')+
                    ' to playlist - Added '+
                    songs.length+' of '+songLinks.length+
                    ' song'+(songLinks.length > 1 ? 's' : '')+
                    ' to playlist '+params[0]);

          });

        });

      });

    }, 2, ['string', 'string'], 'playlistadd -- Adds a song to the specified playlist.\n'+
                                '                   Example:\n'+
                                '                    > !playlistadd playlist_name <youtube url> // adds the song tring the link to the playlist.');


    console.log('Done!');

  };

  return mod;
};
