/*jshint esversion: 6 */

module.exports = function (commands, app) {

  console.log('Loading command module: Basic...');

  let mod = {};

  mod.init = () => {
    // Add 'ping' command
    commands.add('ping', (msg, params) => {
      return new Promise((resolve, reject) => {
        msg.channel.send('Pong!');
        resolve('Ping. Pong!');
      });
    }, 0, [], 'ping  -- Pong!');

    // Add 'help' command
    commands.add('help', (msg, params) => {
      return new Promise((resolve, reject) => {

        if (params.length > 0) {
          if (!commands.exists(params[0])) {
            msg.channel.send('`' + app.config.prefix + params[0] +
                             '` is not a command. Use `'+app.config.prefix+'help` ' +
                             'to see available commands.');
            reject('Failed to help - unknown command');
            return;
          }
          msg.author.send('**' + params[0] + '**\n```\n' + commands[params[0]].desc + '\n```');
          resolve('Gave help to a user!');
          return;
        }

        let outString = [commands.help.desc + '\n\n'];
        for (let c in commands) {
          if (commands.exists(c) && c != 'help') {
            let currOutLen = outString[outString.length-1].length;
            if ((currOutLen + commands[c].desc.length) < (2000-8)) {
              outString[outString.length-1] += commands[c].desc + '\n\n';
            } else {
              outString.push(commands[c].desc + '\n\n');
            }
          }
        }
        for (let i = 0; i < outString.length; i++) {
          msg.author.send('```\n' + outString[i] + '```');
        }

        resolve('Gave help to a user!');

      });

    }, 0, ['string'], 'help  -- Show this info.\n'+
                      '        You can also get help on a specific command like this "'+app.config.prefix+'help <command name here>"\n'+
                      '            Example:\n'+
                      '             > '+app.config.prefix+'help ping');


    console.log('Done!');
  };

  return mod;

};
