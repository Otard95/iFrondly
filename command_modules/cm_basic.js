/*jshint esversion: 6 */
/*jshint node: true */

const fs   = require('fs');
const path = require('path');

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
    }, 0, [], 'ping           -- Pong!');

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

    }, 0, ['string'], 'help           -- Show this info.\n'+
                      '                  You can also get help on a specific command like this "'+app.config.prefix+'help <command name here>"\n'+
                      '                      Example:\n'+
                      '                       > '+app.config.prefix+'help ping');

    commands.add('changelog', (msg, params) => {

      return new Promise((resolve, reject) => {

        let sendSamll = function (str) {
          if (str.length > 2000) {
            let strArr = str.split(' ');
            let firstHalf = strArr.splice(0, Math.round(strArr.length/2));
            sendSamll(firstHalf.join(' '));
            sendSamll(strArr.join(' '));
          } else {
            msg.author.send(str);
          }
        };

        let file = path.resolve(process.cwd(), 'LatestChanges.md');
        console.log(file);
        let fileContent = fs.readFileSync(file, 'utf8');
        console.log(fileContent);
        sendSamll(fileContent);
        resolve('Sendt changelog to user.');

      });

    }, 0, [], 'changelog      -- Have a look at the latest change log.');

    console.log('Done!');
  };

  return mod;

};
