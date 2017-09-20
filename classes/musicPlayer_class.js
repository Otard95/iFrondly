/*jshint esversion: 6 */

const SkipVote = require('./skipVote_class.js');

module.exports = class MusicPlayer {

  constructor (ytdl, config) {
    this.queue = [];
    this.playing = false;
    this.voiceConnection = undefined;
    this.yt = ytdl;
    this.config = config;
    this.skipVote = undefined;
    this.currentlyPlaying = undefined;
  }

  startStream (song) {
    console.log('Debug: in startStream()');
    this.currentlyPlaying = song;
    song.originalMessage.channel.send('Playing "' + song.name +
                                      '" as requested by ' +
                                      song.originalMessage.author.username +
                                      '\nSongs left in the queue: ' +
                                      this.queue.length);
    this.playing = true;
    console.log('Debug: startStream() prep done | queue: ', this.queue);
    var ytStream = this.yt(song.url,{ audioonly: true });
    this.voiceConnection
      .playStream(ytStream,
                  {volume: this.config.defaultVolume,
                   passes: this.config.passes});
    console.log('Debug: vc.playStream() done | vc.dispatcher.destroyed: ',
                this.voiceConnection.dispatcher.destroyed);
		this.voiceConnection.dispatcher.on('end', () => {
      console.log('Debug: on end invoced');
      this.skipVote = undefined;
      if (this.queue.length == 0) {
        console.log('Debug: queue empty');
        this.currentlyPlaying.originalMessage
          .channel.send('That was the last one, show\'s over.');
        this.currentlyPlaying = undefined;
        this.playing = false;
      }
		});
		this.voiceConnection.dispatcher.on('error', (err) => {
			console.log('error: ' + err);
      this.playing = false;
      song.originalMessage.author.send('Sadly i could not play "' + song.name +
                                       '" for you. I ran into some problems');
      console.log('Debug: in vc.dispatcher.on(\'error\')');
      this.voiceConnection.dispatcher.end();
		});
  }

  stop () {
    this.queue = [];
    this.skipVote = undefined;
    this.playing = false;
    this.currentlyPlaying = undefined;
    if (this.voiceConnection.dispatcher) this.voiceConnection.dispatcher.end();
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

  skip () {

    return new Promise((resolve, reject) => {

      this.voiceConnection.dispatcher.end();

      // give the dispather a second to end
      setTimeout(()=> {
        this.startStream(this.queue.shift());
        resolve();
      }, 800);

    });

  }

  cleanup () {
    this.stop();
  }

};
