/*jshint esversion: 6 */
/*jshint node: true */

const Song = require('../classes/Song_class.js');
const util = require('../bin/utils.js');

module.exports = function (commands, app) {

  console.log('Loading command module: Playlist...');

  app.db.createDB('playlists').then((res) => {
    console.log('Playlist database first time setup: '+res.message);
    let template = {
      tableName: '',
      owner: ['']
    };
    app.db.execute('createTable', 'playlists', 'playlistOwner', template)
      .then((res) => {
        console.log('Playlist database first time setup complete:\n'+
                    res.humanreadable);
      }).catch((err) => {
        console.log('Unexpected error:\n', err);
        exit(2);
      });
  }).catch((err) => {
    if (err.statusCode == app.db.codes.U_DATABASE_ALLREADY_EXISTS) {
      console.log('Playlist database foud:\n'+err.humanreadable);
    } else {
      console.log('Failed to initialize database:\n'+err.message);
      exit(2);
    }
  });

  function isOwner (author, playlist) {
    return new Promise((resolve, reject) => {
      let selector = {
        tableName: playlist
      };
      app.db.execute('select', 'playlists', 'playlistOwner', selector)
        .then((res) => {
          if (res.statusCode == app.db.codes.NONE_FOUND) {
            reject('No entry found');
          } else {
            let inc = res.res[0].owner.includes(''+author.username + author.tag);
            if (inc) {
              resolve();
            } else {
              reject('not owner');
            }
          }
        }).catch((err) => {
          reject('err');
        });
    });
  }

  let mod = {};

  mod.init = () => {

    /*
     *  NewPlaylist command creates a new playlist and adds the
     *  msg author as the owner.
     *  playlist are public but only the creator can edit them.
     */

    commands.add('newPlaylist', (msg, params) => {

      return new Promise((resolve, reject) => {

        app.db.execute('createTable', 'playlists', params[0])
          .then((res) => {

            // table created now assign the owner
            let owner = {
              tableName: params[0],
              owner: [''+msg.author.username + msg.author.tag],
              // make sure this ownership doesn't allready exits
              exists: (o1, o2) => o1.tableName == o2.tableName
            };
            app.db.execute('insert', 'playlists', 'playlistsOwner', owner)
              .then((res) => {

                // ownership registered
                msg.reply('I creted your new playlist \''+params[0]+'\'.'+
                          ' Use `'+app.config.prefix+'playlistAdd` to add '+
                          'some songs to it.');
                resolve('Playlist create - Created \''+params[0]+'\'');

              }).catch((err)=> {

                // something whent worng the ownership could not be registered
                // so we neet to remove the playlist
                msg.reply('I his a bit of a snag. Try once again.');
                reject('Playlist create - unexpected error:\n',err);
                // try cleanup
                app.db.execute('dropTable', 'playlists', params[0])
                  .then( () => console.log(' -- table removed'))
                  .catch(() => console.log(' -- could not remove table'));

              });

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

    }, 1, ['string'], 'newPlaylist    -- Creates a new playlist with the name specified.\n' +
                      '                      Example:\n' +
                      '                       > '+app.config.prefix+'newplaylist Gaming // Createds a new empty playlist named \'Gameing\'');

    /*
     *  PlaylistAdd adds a somg to a playlist
     */

    commands.add('playlistAdd', (msg, params, internalChecks) => {

      return new Promise((resolve, reject) => {

        if (!internalChecks){// check is playlist exists

          app.db.execute('select', 'playlists', params[0])
          .then((res) => {

            isOwner(msg.author, params[0])
              .then(() => {

                commands.playlistadd.run(msg, params, true)
                  .then ( res=>resolve(res) )
                  .catch( err=>reject (err) );

              }).catch((err) => {

                msg.reply('You can only edit playlist that you yourself created,'+
                          ' or if the owner shared the playlist with you.\n'+
                          'If you you think this is a mistake contact my creator.');
                reject('Playlist add | owner check: ' + err);

              });

          }).catch((err) => {

            if (err.statusCode == app.db.codes.U_TABLE_NOT_FOUND) {
              msg.reply('That playlist doesn\'t exits. '+
                        'You can create a new playlist using the `'+
                        app.config.prefix+'newPlaylist` command.');
              reject('Playlist add - failed, no such playlist');
              tableEx = false;
            }

          });
          return;
        }

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
                               info.length_seconds,
                               info.video_id);
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
                           song)
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

          // add a equals methud to the song objects
          for (let i = 0; i < songs.length; i++) {
            songs[i].equals = (obj1, obj2) => obj1.vidID == obj2.vidID;
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
            (failed.length > 1 ? 'these':'this')+
            ' song'+(failed.length > 1 ? 's:\n  - ':' ');

            for (let i = 0; i < failed.length; i++) {
              msgFailed += failed[i] + '\n  - ';
            }

            msgFailed = msgFailed.substr(0,msgFailed.length-5);

            msgDuplicates = '';
            if (duplicates.length > 1) {
              msgDuplicates = 'These songs are already in the playlist:';
              for (let i = 0; i < duplicates.length; i++) {
                msgDuplicates += '\n  - ' + duplicates[i];
              }
            } else if (duplicates.length == 1) {
              msgDuplicates = '\''+duplicates[0] +
                              '\' is already in the playlist';
            }

            let reply = 'Added ';
            reply    += inserted+' of '+songLinks.length;
            reply    += ' song'+(songLinks.length > 1 ? 's' : '');
            reply    += ' to playlist \''+params[0]+'\'';
            if (failed.length > 0)     reply += '\n' + msgFailed;
            if (duplicates.length > 0) reply +=  '\n' + msgDuplicates;
            msg.reply(reply);

            resolve('Add song'+(inserted > 1 ? 's' : '')+
                    ' to playlist - Added '+
                    inserted+' of '+songLinks.length+
                    ' song'+(songLinks.length > 1 ? 's' : '')+
                    ' to playlist '+params[0]);

          }).catch((err) => {
            console.log(err);
          });

        }).catch((err) => {
          console.log(err);
        });

      });

    }, 2, ['string', 'string'], 'playlistAdd    -- Adds a song to the specified playlist.\n'+
                                '                      Example:\n'+
                                '                       > '+app.config.prefix+'playlistadd Gameing <youtube url> // adds the song from the link to the \'Gameing\' playlist.');

    /*
     *  QueuePlaylist command will add all the songs in a playlist to the queue
     */

    commands.add('queuePlaylist', (msg, params) => {

      return new Promise((resolve, reject) => {

        let songs;
        // check is playlist exists and get songs
        app.db.execute('select', 'playlists', params[0])
          .then((res) => {
            if (res.statusCode == app.db.codes.NONE_FOUND) {
              msg.reply('This playlist is empty. Add some songs to it using `'+
                         app.config.prefix+'playlistAdd`.');
              reject('Playlist queue - no songs in playlist');
              return;
            }
            songs = res.res;
          }).catch((err) => {
            if (err.statusCode == app.db.codes.U_TABLE_NOT_FOUND) {
              msg.reply('That playlist doesn\'t exits. '+
                        'You can create a new playlist using the `'+
                        app.config.prefix+'newPlaylist` command.');
              reject('Playlist queue - failed, no such playlist');
              return;
            }
          });

          /* songs from the database don't have a msg attaced whish
           * is needed for other tasks. so add the current msg to the songs
           */
          for (let i = 0; i < songs.length; i++) {
            songs[i].originalMessage = msg;
          }

          // now appand the songs to the existing queue
          app.musicPlayer.queue = app.musicPlayer.queue.concat(songs);

          msg.reply('I queued the songs from the \''+params[0]+'\' playlist.');
          resolve('Playlist queue - queued playlist \''+params[0]+'\'');

      });

    }, 1, ['string'], 'queuePlaylist  -- Use this command to queue all songs from a playlist.\n'+
                      '                      Example:\n'+
                      '                       > '+app.config.prefix+'queuePlaylist Gaming');

    /*
     *  PlaylistInfo will give you the names of all the songs in the playlist
     */

    commands.add('playlistInfo', (msg, params) => {

      return new Promise((resolve, reject) => {

        app.db.execute('select', 'playlists', params[0])
          .then((res) => {

            // Generate reply string from table contents
            let PLInfo = 'Songs in \'' + params[0] + '\' playlist:';
            for (let i = 0; i < res.res.length; i++) {
              PLInfo += '\n '+(i+1)+'. ' + res.res[i].name;
            }

            msg.channel.send(PLInfo);
            resolve('Playlist info - info sendt');

          }).catch((err) => {

            if (err.statusCode == app.db.codes.U_TABLE_NOT_FOUND) {
              msg.reply('There is no playlist by that name');
              reject('Playlist info - no such playlist');
            } else {
              msg.reply('I ran into some problems.');
              reject(err);
            }

          });

      });

    }, 1, ['string'], 'playlistInfo   -- Lists all songs in the playlist');

    /*
     * PlaylistRemove command removed a song from a playlist
     */
    commands.add('playlistRemove', (msg, params, ownerCheck) => {

      return new Promise((resolve, reject) => {

        // check creator
        if (ownerCheck == undefined) {
          isOwner(msg.author, params[0])
            .then((res) => {

              commands.playlistremove.run(msg, params, true)
                .then (res => resolve(res))
                .catch(err => reject (err));

            }).catch((err) => {

              reject('Playlist remove failed - owner check: ', err);

            });
          return;
        }

        let selector = (el, i) => {
          for (let index = 1; index < params.length; index++) {
            if (i == (parseInt(params[index]) - 1)) return true;
          }
          return false;
        };

        app.db.execute('delete', 'playlists', params[0], selector)
          .then((res) => {

            if (res.statusCode == app.db.codes.NONE_FOUND) {
              msg.reply('I couldn\'t find '+
                         params.length > 2 ? 'any of these songs.' : 'that song.');
              reject('Playlist remove - NONE_FOUND');
            } else {
              msg.reply('Removed '+
                         (res.res.length==(params.length-1)?'all':res.res.length)+
                         ' of the '+
                         (params.length-1)+' song'+(params.length>2?'s':'')+
                         ' you specified.');
            }

          }).catch((err) => {
            if (err.statusCode == app.db.codes.U_TABLE_NOT_FOUND) {
              msg.reply('\''+params[0]+'\' is not a playlist');
              reject('Playlist remove - no such playlist');
            } else {
              msg.reply('I hit a snag. Lets give it one more shot.');
              reject('Playlist remove - error:\n'+err.message);
            }
          });

      });

    }, 2, ['string', 'number'], 'playlistRemove -- Deletes a song from a playlist based on its index.\n'+
                                '                  See `'+app.config.prefix+'playlistInfo`, you can refer to the\n'+
                                '                  `'+app.config.prefix+'help` connamd if you want more information.\n'+
                                '                      Example:\n'+
                                '                       > '+app.config.prefix+'playlistRemove Gaming 3 // deletes the third song in the playlist');

    console.log('Done!');

  };

  return mod;
};
