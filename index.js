/*jshint esversion: 6 */

/*
  Config setup
*/
let config = require('./bin/config.json');

/*
  Package imports
*/
const Discord     = require('discord.js');
const yt          = require('ytdl-core');
const App         = require('./classes/app_class.js');
const MusicPlayer = require('./classes/musicPlayer_class');
const util        = require('./bin/utils.js');
const db          = require('simple_json_database')('sJSON_DB');

/*
  Setup Client, App and Database object
*/
const client  = new Discord.Client();
let app       = new App(client, yt, config, db);

/*
  Setup Commands
*/
let Commands = require('./bin/commands.js');
let commands = new Commands();
let basic_commands =
      require('./command_modules/cm_basic.js')(commands);
let channelControll_connamds =
      require('./command_modules/cm_channelControll.js')(commands, app);
let music_commands =
      require('./command_modules/cm_music.js')(commands, app);
let playlist_commands =
      require('./command_modules/cm_playlist')(commands, app);

basic_commands.init();
channelControll_connamds.init();
music_commands.init();
playlist_commands.init();

/*
  Setup events
*/
// On ready
client.on('ready', ()=>{
  console.log('Logged in as ' + client.user.tag + '!');
  client.user.setGame('dead');
  client.user.setStatus("online");
});

// Message handler
client.on('message', (msg)=>{

  // Check if the message has the command prefix and not sendt from another bot
  if (!msg.content.startsWith(config.prefix) || msg.author.bot) return;

  // Format message to get command and parameters separate
  let c = commands.formatMsg(msg.content);

  // Check if the command exists
  if (!commands.exists(c.command)) {
    // It doesn't. Send a heads up to the user
    msg.reply('`' + config.prefix + c.command +
              '` is not a command. You can refer to the `' + config.prefix +
              'help` command if you are unsure of what i can do.');
    return;
  }

  // It does. Get the command object for further user
  let cmnd = commands[c.command];

  // Now check if the parameters needed are supplied
  if (c.params.length < cmnd.argc) {
    // There are to few parameters
    msg.reply('`' + config.prefix + c.command +
              '` requires ' + cmnd.argc + ' parameters. ' +
              'You can refer to the `' + config.prefix +
              'help` command if you dont know what they are.');
    return;
  }

  // There are enough arguments. Check if their type is correct
  for (let i = 0; i < cmnd.argt.length; i++) {
    if (c.params[i] && !util.checkType(c.params[i], cmnd.argt[i])) {
      // The type is incorrect
      msg.reply('Invalid parameters where passed to `' + config.prefix + c.command +
                '`. You can refer to the `' + config.prefix +
                'help` command if you dont know what they are.');
      return;
    }
  }

  // All types are correct. Preform task
  cmnd.run(msg, c.params)
    .then((res) => { console.log(res); })
    .catch((err) => { console.log(err); });

});

/*
  Finally log in
*/
client.login(config.botToken);

/*
  Whaen bot exits do final cleanup
*/

let cleanupDone = false;

process.stdin.resume();

process.on('exit', cleanup);

process.on('SIGINT', cleanup);

cleanup = function() {
  if (cleanupDone) return;
  cleanupDone = true;
  console.log('\nGoodbye o/\n');
  app.cleanup();
  client.user.setStatus("invisible");
  client.destroy();
  process.exit(0);
};
