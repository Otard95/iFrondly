/*jshint esversion: 6 */

module.exports = function (commands) {

  var mod = {};

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
            msg.channel.send('`' + config.prefix + params[0] +
                             '` is not a command. Use `!help` ' +
                             'to see available commands.');
            reject('Failed to help - unknown command');
            return;
          }
          msg.author.send('**' + params[0] + '**\n```\n' + commands[params[0]].desc + '\n```');
          resolve('Gave help to a user!');
          return;
        }

        var outString = '```\n' + commands.help.desc + '\n\n';
        for (let c in commands) {
          if (commands.exists(c) && c != 'help') {
            outString += commands[c].desc + '\n\n';
          }
        }
        msg.author.send(outString + '```');
        resolve('Gave help to a user!');

      });

    }, 0, ['string'], 'help  -- Show this info.\n'+
                      '        You can also get help on a specific command like this "!help <command name here>"\n'+
                      '            Example:\n'+
                      '             > !help ping');
  };

  return mod;

};