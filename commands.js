/*jshint esversion: 6 */

var c = {
  exists: (name) => {
    if (name == 'exists' || name == 'add' || name == 'formatMsg') return false;
    return c.hasOwnProperty(name);
  },
  add: (name, func, argCount, argTypes, description) => {
    c[name] = {
      run: func,
      argc: argCount,
      argt: argTypes,
      desc: description
    };
  },
  formatMsg: (input) => {
    input = input.substr(1);
    var parts = input.split(' ');
    return {
      command: parts[0].toLowerCase(),
      params: parts.slice(1)
    };
  }
};

module.exports = c;
