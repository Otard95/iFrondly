/*jshint esversion: 6 */
/*jshint node: true */

let util   = require('../bin/utils.js');
const Song = require('../classes/Song_class.js');

module.exports = function (commands, app) {

  console.log('Loading command module: Music...');

  let mod = {};

  mod.init = () => {
    commands.add('play', (msg, params) => {

      return new Promise((resolve, reject) => {

        // if allready playing, reject
        if (app.musicPlayer.playing) {
          msg.reply('I\'m allready playing. Use `'+app.config.prefix+'queue` to add a song to the queue.');
          reject('Failed to play - Allready playing');
          return;
        }

        // make sure bot is in a voice channel
        if (!app.voiceChannel || !app.musicPlayer.voiceConnection){
          console.log('Play - Joining voice channel');
          return commands.join.run(msg, []).then((res) => { // try to join vc
            // Success! retry play
            commands.play.run(msg, params).then((res) => {
              // success! resolve play
              resolve(res);
              return;
            }).catch((err) => {
              //fail, reject play
              reject(err);
              return;
            });
          }).catch((err) => {
            // failed, reject join
            reject(err);
            return;
          });
        }

        // if link is specified add to queue
        if (params[0]) {

          // check for if param is link or playlist
          if (app.yt.validateURL(params[0])) {

            console.log('Play - adding song to queue');

            return commands.queue.run(msg, params).then((res) => {
              console.log('Play - retrying play');
              // success! retry play
              commands.play.run(msg, []).then((res) => {
                // success! resolve play
                resolve(res);
              }).catch((err) => {
                //fail, reject play
                reject(err);
              });
            }).catch((err) => {
              // failed to queue
              reject('Failed to play - ' + err);
              return;
            });

          } else { // try to find playlist

            console.log('Play - trying to queue playlist...');
            return app.db.execute('select', 'playlists', params[0])
              .then((res) => {

                let songs = res.res;
                for (let i = 0; i < songs.length; i++) {
                  songs[i].originalMessage = msg;
                }

                app.musicPlayer.queue = songs;

                console.log('Play - playlist queued\n'+
                            '       retrying play');
                commands.play.run(msg, []).then((res) => {
                  // success! resolve play
                  resolve(res);
                }).catch((err) => {
                  //fail, reject play
                  reject(err);
                });

              }).catch((err) => {
                if (err.statusCode == app.db.codes.U_TABLE_NOT_FOUND) {
                  msg.reply('This playlist doesn\'t exist.');
                  reject('Play - playlist doesn\'t exits.');
                  return;
                }
                msg.channel.send('I ran into some problems. '+
                                 'Im unable to play that playlist.');
                reject('Play - err on playlist:\n'+err.message);
                return;
              });

          }


        } // END IF

        // if there is a dispatcher resume it and resolve
        if (app.musicPlayer.voiceConnection.dispatcher) {
          app.musicPlayer.playing = true;
          app.musicPlayer.voiceConnection.dispatcher.resume();
          msg.reply('There where song songs in the queue form earlier. '+
                    'I\'ll resume from there.');
          resolve('Succeeded to play - resume');
          return;
        }

        // if the queue is empty reject
        if (app.musicPlayer.queue.length == 0) {
          msg.reply('The queue is empty. Add some songs to it using '+
                    '`'+app.config.prefix+'queue`. '+
                    'You can also try `'+
                    app.config.prefix+'play <youtube link>`, '+
                    'or see `'+app.config.prefix+'help` for more info');
          reject('Failed to play - no songs in queue');
          return;
        }

        // Play next song from queue
        let song = app.musicPlayer.queue.shift();
        app.musicPlayer.startStream(song);
        resolve('Succeeded to play - next in queue: ' + song.name);

      });

    }, 0, ['string'], 'play           -- Plays music form the queue or the link(youtube) specified.\n' +
                      '                  You may also specify a playlist intead\n'+
                      '                      Example:\n' +
                      '                       > '+app.config.prefix+'play // plays the current song or the next from queue\n' +
                      '                       > '+app.config.prefix+'play https://www.youtube.com/watch?v=KbNXnxwMOqU // plays the song from the link\n'+
                      '                       > '+app.config.prefix+'play Gaming // plays all songs from the playlist \'Gaming\'');

    commands.add('pause', (msg, params) => {

      return new Promise( (resolve, reject) => {

        // if allready paused
        if (!app.musicPlayer.playing) {
          msg.reply('Allready paused.');
          reject('Failed to pause - allready paused');
          return;
        }
        app.musicPlayer.playing = false;
        app.musicPlayer.voiceConnection.dispatcher.pause();
        resolve('Succeeded in pausing');

      });

    }, 0, [], 'pause -- Pauses the song currently playing.');

    commands.add('queue', (msg, params) => {

      return new Promise((resolve, reject) => {

        app.yt.getInfo(params[0], (err, info) => {

    			if(err) {
            reject('ytdl err on .getInfo() -- ' + err);
            msg.channel.send("I cound not resolve that link. "+
                             "Make sure its correct.");
            return;
           }
    			app.musicPlayer.queue.push(new Song (params[0],
                                               info.title,
                                               info.length_seconds,
                                               msg));
          resolve('Song added to queue.');
    		});

      });

    }, 1, ['string'], 'queue          -- Adds a song to the queue.\n' +
                      '                  !!! Requires 1 parameter\n'+
                      '                   - url (youtube link)\n'+
                      '                      Example:\n'+
                      '                       > '+app.config.prefix+'queue https://www.youtube.com/watch?v=KbNXnxwMOqU // adds the song from the link to the queue');

    commands.add('skip', (msg, params) => {

      return new Promise((resolve, reject) => {


        // check is there is even a song playing
        if (!app.musicPlayer.playing) {
          // no song playing
          msg.reply('There is no song playing.');
          reject('Failed skip vote - no song playing');
          return;
        }

        if (app.musicPlayer.isVoting()) {
          // !!!###!!! a vote is ongoing register this vote !!!###!!!
          let res = app.musicPlayer.voteToSkip(msg.member.id);
          // prosess resoult
          if (res.status) { // ### vote registered
            if (res.done) {
              // vote passed, skip song
              res.msg.channel.send('Vote passed. Skipping song.');
              app.musicPlayer.skip().then((res)=> {
                resolve('Skip vote passed - skipping song');
              });
            } else {
              // update status
               res.msg.edit(app.config.skipVoteMsgPrefab
                        .replace('&p;', Math.round(res.ratio * 100) + '%')
                        .replace('&s;', app.musicPlayer.currentlyPlaying.name))
                          .then((res) => {
                            app.musicPlayer.skipVote.msg = res;
                            resolve('Skip vote update - vote registered');
                          }).catch((err) => {
                            reject('Skip vote update - failed to update message '+
                                   '| err: ' + err);
                          });
            }
          } else { // ### vote threw error
            // since the system is perfect the user fucked something up.
            msg.reply(res.err);
            resolve('Skip vote update - user vote not registered');
          } // END resoult prosessing
        } else {
          // !!!###!!! no vote started yet, start one !!!###!!!
          // if ony one user in channel skip regardless
          if (app.voiceChannel.members.filterArray((m) => {
            return !m.user.bot;
          }).length <= 1) {
            msg.channel.send('Skipping song.');
            app.musicPlayer.skip().then((res)=> {
              resolve('Skip vote - ony 1 user, skipping');
            });
            return;
          }
          // otherwise start vote
          msg.channel.send('A vote to skip this song has been started. '+
                           'Use `'+app.config.prefix+'skip` to vote.')
                      .then((res) => {
                        app.musicPlayer
                          .startVoteSkip( msg.member.id,
                                          app.voiceChannel.members.filterArray((m) => {
                                            return !m.user.bot;
                                          }).map((m) => {
                                            return m.id;
                                          }), res);
                        resolve('Skip vote started');
                      }).catch((err) => {
                        reject('Skip vote start - failed to start vote '+
                               '| err: ' + err);
                      });
        }

      });

    }, 0, ['number'], 'skip           -- Skips one or more songs in the queue.\n'+
                      '                      Example:\n'+
                      '                       > '+app.config.prefix+'skip // skips the current song\n'+
                      '                       > '+app.config.prefix+'skip 3 // skips the current and the next two songs');


    console.log('Done!');
  };

  return mod;

};
