/*jshint esversion: 6 */

const SkipVote = require('./skipVote_class.js');

module.exports = class MusicPlayer {

  constructor (ytdl, config) {
    this.queue = []; // the array that is the song queue
    this.playing = false; /* if there is a song playing
                            (regardless of if a song is paused) */
    this.voiceConnection = undefined; /* the voice connection
                                          to the voice channel */
    this.yt = ytdl; // ytdl-core
    this.config = config; // what do you tink
    this.currentlyPlaying = undefined; /* the song currently
                                          playing or paused */
    this.skipVote = undefined; /* if users are voting to skip the
                                  current song this controlles the vote */
    this.isSkipping = false; /* If we kurrently are in the prosess
                              of skipping a song */
    this.playNext = function () {
      setTimeout(() => {
        this.startStream(this.queue.shift());
      }, 800);
    }; // END Func
  }

  startStream (song) {
    this.currentlyPlaying = song;
    song.originalMessage.channel.send('Playing "' + song.name +
                                      '" as requested by ' +
                                      song.originalMessage.author.username +
                                      '\nSongs left in the queue: ' +
                                      this.queue.length);
    this.playing = true;
    let ytStream = this.yt(song.url,{ audioonly: true });
    let options = {volume: this.config.defaultVolume,
                   passes: this.config.passes};

    this.voiceConnection.playStream(ytStream, options);

    this.isSkipping = false;

		this.voiceConnection.dispatcher.on('end', () => {
      this.skipVote = undefined;
      if (this.queue.length == 0) {
        this.currentlyPlaying.originalMessage
          .channel.send('That was the last one, show\'s over.');
        this.currentlyPlaying = undefined;
        this.playing = false;
        return; // since queue is empty don't play next
      }
      if (!this.isSkipping) this.playNext();
		});

		this.voiceConnection.dispatcher.on('error', (err) => {
			console.log('error: ' + err);
      this.playing = false;
      song.originalMessage.author.send('Sadly i could not play "' + song.name +
                                       '" for you. I ran into some problems');
      this.voiceConnection.dispatcher.end();
		});

  }

  stop () {
    this.queue = [];
    this.skipVote = undefined;
    this.playing = false;
    this.currentlyPlaying = undefined;
    if (!this.voiceConnection) return;
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
    let res = {};
    let ret = this.skipVote.vote(memberId);
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

      this.isSkipping = true;

      this.voiceConnection.dispatcher.end();

      // if songs left in queue
      // give the dispather a second to end
      // then play next
      if(this.queue.length > 0) {
        setTimeout(()=> {
          this.startStream(this.queue.shift());
          resolve('play next');
        }, 800);
      } else {
        resolve('queue empty');
      }

    });

  }

  cleanup () {
    this.stop();
  }

};
