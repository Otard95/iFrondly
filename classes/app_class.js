/*jshint esversion: 6 */

const MusicPlayer = require('./musicPlayer_class.js');

module.exports = class App {

  constructor (client, ytdl, config, db) {
    this.client = client;
    this.musicPlayer = new MusicPlayer(ytdl, config);
    this.voiceChannel = undefined;
    this.yt = ytdl;
    this.config = config;
    this.db = db;
  }

  cleanup () {
    if (this.musicPlayer) this.musicPlayer.cleanup();
    delete this.musicPlayer;
    if(this.voiceChannel) this.voiceChannel.leave();
    delete this.voiceChannel;
  }

};
