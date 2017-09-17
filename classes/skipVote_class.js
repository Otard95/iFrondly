/*jshint esversion: 6 */

module.exports = class SkipVote {

  constructor (passRatio, members, message) {
    this.passRatio = passRatio;
    this.vcMembers = members;
    this.votes = [];
    this.ratio = 0;
    this.msg = message; /* The message that the bot sent
                           to show the status of the vote */
  }

  vote (memberId) {
    // if member was not in vc when vote began, disregard vote
    if (!this.vcMembers.find((id) => { return id == memberId; }))
      return 'You where not here when the vote started, '+
             'so sadly you can\'t vote this time';
    // if membe allready has voted, disregard vote
    if (this.votes.find((id) => { return id == memberId; }))
      return 'You can only vote once.';
    this.votes.push(memberId);
    return this.isPassing();
  }

  isPassing () {
    this.ratio = this.votes.length / this.vcMembers.length;
    if ( this.ratio > this.passRatio ) return true;
    return false;
  }

};
