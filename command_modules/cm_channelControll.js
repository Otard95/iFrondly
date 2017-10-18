/*jshint esversion: 6 */

module.exports = function (commands, app) {

  console.log('Loading command module: Channel Controll...');

  let mod = {};

  mod.init = () => {
    commands.add('join', (msg, params) => {

      return new Promise((resolve, reject) => {

      let voiceChannel;
        // Check if channel name is specified
        if (params[0]) {

          // channel name specified, join that channel if it exitst.
          voiceChannel = msg.guild.channels
                          .find( val => val.type === 'voice' &&
                                        val.name === params[0] );
          // was there a voice channel with the specified name
          if (!voiceChannel) {
            // No voice channel found
            msg.reply("I couldn't find that channel.");
            reject('Failed to join voice channel - could not find server.');
            return;
          }

        } else {

          // no channel name specified tying to join the authors voice channel
          voiceChannel = msg.member.voiceChannel;
          // Was the user in a voiceChannel?
          if (!voiceChannel || voiceChannel.type != 'voice') {
            // author is not in a voice channel.
            msg.reply('You need to tell me what channel to join ' +
                      'or join one yourself. If you need help using ' +
                      'this command you can use `!help join`');
            reject('Failed to join voice channel - user not in any channel.');
            return;
          }

        }

        voiceChannel.join()
          .then( (conn) => {
            app.voiceChannel = voiceChannel;
            app.musicPlayer.voiceConnection = conn;
            resolve("Connected to voice channel '" +
                    voiceChannel.name + "'");
          })
          .catch( (err) => {
            reject("Failed to join voice channel\n  Error:\n" + err);
          } );
      });


    }, 0, ['string'], 'join  -- Joins your voice channel or the one specified.\n'+
                      '            Example:\n'+
                      '             > !join // joins your voice channel\n'+
                      "             > !join Chill // joins channel named 'Chill'");

    commands.add('leave', (msg, params) => {

      return new Promise((resolve, reject) => {

        if (!app.voiceChannel) {
          msg.reply("I'm not in any channel");
          reject('Failed to leave voice channel - was not in that channel.');
          return;
        }

        // leave the channel
        let tempName = app.voiceChannel.name;
        app.musicPlayer.stop();
        app.voiceChannel.leave();
        app.voiceChannel = undefined;
        resolve("Left channel '" + tempName + "'");

      });

    }, 0, [], 'leave -- Leaves the current voice channel if any.');


    console.log('Done!');
  };

  return mod;

};
