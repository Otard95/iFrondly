/*jshint esversion: 6 */

module.exports = class {

  constructor () {

  }

  exists (name) {
    if (name == 'exists' || name == 'add' || name == 'formatMsg') return false;
    return c.hasOwnProperty(name);
  }

  add (name, func, argCount, argTypes, description) {
    name = name.toLowerCase();
    if (this.exists(name)) throw 'Command all ready added.';
    this[name] = {
      run: func,
      argc: argCount,
      argt: argTypes,
      desc: description
    };
  }

  formatMsg (input) {
    input = input.substr(1);
    let parts = input.split(' ');
    return {
      command: parts[0].toLowerCase(),
      params: parts.slice(1)
    };
  }

};
