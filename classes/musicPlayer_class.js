/*jshint esversion: 6 */

const SkipVote = require('./skipVote_class.js');

module.exports = class MusicPlayer {

  constructor (ytdl, config) {
    this.queue = [];
    this.playing = false;
    this.voiceConnection = undefined;
    this.dispatcher = undefined;
    this.yt = ytdl;
    this.config = config;
    this.skipVote = undefined;
    this.currentlyPlaying = undefined;
  }

  startStream (song) {
    this.currentlyPlaying = song;
    song.originalMessage.channel.send('Playing "' + song.name +
                                      '" as requested by ' +
                                      song.originalMessage.author.username +
                                      '\nSongs left in the queue: ' +
                                      this.queue.length);
    this.playing = true;
    this.dispatcher =
      this.voiceConnection
        .playStream(this.yt(song.url,{ audioonly: true }),
                    {volume: this.config.defaultVolume,
                     passes: this.config.passes});
		this.dispatcher.on('end', () => {
      this.skipVote = undefined;
      if (this.queue.length === 0) {
        this.currentlyPlaying.originalMessage
          .channel.send('That was the last one, show\'s over.');
        this.currentlyPlaying = undefined;
        this.dispatcher = undefined;
        this.playing = false;
        return;
      }
      this.startStream(this.queue.shift());
		});
		this.dispatcher.on('error', (err) => {
			console.log('error: ' + err)
      song.originalMessage.author.send('Sadly i could not play "' + song.name +
                                       '" for you. I ran into some problems');
      this.dispatcher.end();
		});
  }

  stop () {
    if (this.dispatcher) this.dispatcher.end();
    this.dispatcher = undefined;
  }

  isVoting () {
    return this.skipVote != undefined;
  }

  startVoteSkip (vote, members, message) {
    this.skipVote = new SkipVote(this.config.skipPassRatio,
                                 members,
                                 message);
    this.skipVote.vote(vote);
  }

  voteToSkip (memberId) {
    var res = {};
    var ret = this.skipVote.vote(memberId);
    if (typeof ret === 'boolean') {
      res.status = true;
      res.done = ret;
      res.ratio = this.skipVote.ratio;
      res.msg = this.skipVote.msg;
      return res;
    }

    res.status = false;
    res.err = ret;
    return res;

  }

  cleanup () {
    if (this.dispatcher) this.dispatcher.end();
    delete this.dispatcher;
  }

};
